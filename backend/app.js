// backend/app.js
require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const Folder = require("./models/Folder");
const Flashcard = require("./models/Flashcard");
const attachVersus = require("./sockets/versus");

const jwt = require("jsonwebtoken");
const User = require("./models/User");

const auth = require("./middleware/auth");

const multer = require("multer");
const pdfParse = require("pdf-parse");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";



//check
// --- Express
const app = express();
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage() ,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

async function generateFlashcardsFromTextWithLlama(rawText) {
  const MAX_CHARS = 12000; // keep it cheap & fast
  let text = (rawText || "").trim();
  if (!text) {
    throw new Error("No text provided to Llama");
  }
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
  }

  const systemPrompt = `
You are a study assistant that turns class notes into clear Q&A flashcards.

Rules:
- Focus on key concepts, definitions, formulas, and important facts.
- Questions must be short and specific.
- Answers must be concise but correct.
- Avoid duplicates and trivial facts.
- Aim for 10–25 cards if the notes are long enough.
- Respond with JSON ONLY in this exact format:

{
  "cards": [
    { "question": "Question 1?", "answer": "Answer 1." },
    { "question": "Question 2?", "answer": "Answer 2." }
  ]
}
`.trim();

  const userPrompt = `
Here are the notes:

"""${text}"""

Turn these notes into high-quality flashcards.
`.trim();

  // Call local Llama 3 via Ollama
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Ollama error:", errorText);
    throw new Error("Llama 3 request failed");
  }

  const data = await response.json();

  // Ollama's /api/chat response structure:
  // { message: { role: "assistant", content: "..." }, ... }
  const content =
    data?.message?.content ||
    data?.choices?.[0]?.message?.content ||
    "";

  let jsonText = content.trim();
  const fenced = jsonText.match(/```json([\s\S]*?)```/i);
  if (fenced) {
    jsonText = fenced[1].trim();
  } else {
    const braceMatch = jsonText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonText = braceMatch[0];
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse Llama JSON:", content);
    let relaxed = jsonText
      .replace(/""([^"]*?)""/g, "'$1'")      // inner double-quotes -> single quotes
      .replace(/,\s*([}\]])/g, "$1");       // trailing commas

    try {
      parsed = JSON.parse(relaxed);
    } catch (e2) {
      console.error("Relaxed JSON parse also failed:", relaxed);
      throw new Error("Llama 3 output was not valid JSON");
    }
  }

  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  return cards
    .filter(
      (c) =>
        c &&
        typeof c.question === "string" &&
        typeof c.answer === "string" &&
        c.question.trim() &&
        c.answer.trim()
    )
    .map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
    }));
}
app.post("/api/flashcards/import/pdf", auth, upload.single("file"), async (req, res) => {
  try{
    const {folderId} = req.body;
    if(!folderId){
      return res.status(400).json({error: "folderId is required"});
    }
    if(!req.file){
      return res.status(400).json({error: "PDF file is required"});
    }

    const folder = await Folder.findOne({_id: folderId, user: req.user._id});
    if(!folder){
      return res.status(404).json({error: "Folder not found"});
    }
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;
    if(!text || !text.trim()){
      return res.status(400).json({error: "Please try importing a pdf where you can select/copy text"});
    }
    const cards = await generateFlashcardsFromTextWithLlama(text);
    if(cards.length === 0){
      return res.status(500).json({error: "No flashcards generated from PDF"});
    }

    const docsToCreate = cards.map(c => ({
      question: c.question,
      answer: c.answer,
      folder: folder._id,
      user: req.user._id,
    }));
    const created = await Flashcard.insertMany(docsToCreate);
    return res.json({ createdCount: created.length, cards: created });
  } catch(err){
    console.error("PDF import error:", err);
    return res.status(500).json({error: "Server error: " + err.message});
  }
});

//hellpers
const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
function addDays(d, days){const x = new Date(d); x.setDate(x.getDate() + days); return x;}

function todayBounds(now = new Date()){
  const start = new Date(now);
  start.setHours(0,0,0,0);
  const end = new Date(now);
  end.setHours(23,59,59,999);
  return {start, end};
}

/**
 * Modified SM-2 transition.
 * grade: 0=Again, 1=Hard, 2=Good, 3=Easy
 * returns shallow update { ease, interval, reps, lapses, due, lastReviewedAt }
 */
function nextSchedule(card, grade, now = new Date()) {
  let { ease = 2.5, interval = 0, reps = 0, lapses = 0 } = card;
  if(grade === 0) ease -= 0.2;
  else if(grade === 1) ease -= 0.15;
  else if(grade === 3) ease += 0.15;
  ease = clamp(ease, 1.3, 3.0);

  if (grade === 0) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else if(reps === 0){
    reps = 1;
    interval = 1;
  } else if(reps === 1){
    reps = 2;
    interval = 6;
  } else {
    reps += 1;
    interval = Math.max(1, Math.round(interval * ease));
  }
  return {
    ease,
    interval,
    reps,
    lapses,
    due: addDays(now, interval),
    lastReviewedAt: now,
  };
}

const MAX_REVIEW = 60;
const MAX_NEW = 20;


// Build allowed origins list from env
// kojo
const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// CORS middleware: allow listed origins AND no-origin requests (curl/health)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl / health checks
      return cb(null, allowed.includes(origin));
    },
    credentials: true,
  })
);

//swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/**
 * @swagger
 * /:
 *  get:
 *      summary: Root ping
 *      description: Simple response to see if API is up
 *      tags: [Health]
 *      responses:
 *          200:
 *            description: Plain text OK
 *            content:
 *              text/plain:
 *                schema:
 *                  type: string
 *                   example: API OK
 */
app.get("/", (_req, res) => res.status(200).send("API OK"));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns service health and process uptime (seconds).
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 uptime:
 *                   type: number
 *                   description: Seconds the process has been up
 *                   example: 12.345
 */
app.get("/health", auth, (_req, res) =>
  res.status(200).json({ ok: true, uptime: process.uptime() })
);

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: List folders
 *     description: Returns all folders sorted by name ascending.
 *     tags: [Folders]
 *     responses:
 *       200:
 *         description: Array of folders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Folder'
 *       500:
 *         description: Server error
 */
app.get("/api/folders", auth, async (req, res) => {
  try {
    const folders = await Folder.find({user: req.user._id}).sort({ name: 1 }).lean();
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/daily", auth, async (req, res) => {
  try {
    const scheduled = await Folder.find({ user: req.user._id, schedule: true })
      .select("_id name").sort({ name: 1 }).lean();
    const folderIds = scheduled.map(f => f._id);
    const { end: endOfToday } = todayBounds();
    const baseMatch = { user: req.user._id };
    if (folderIds.length) baseMatch.folder = { $in: folderIds };

    const review = await Flashcard.find({
      ...baseMatch,
      due: { $lte: endOfToday },
      reps: { $gte: 0 }, 
    })
      .select("_id question answer folder ease interval reps lapses due")
      .sort({ due: 1, _id: 1 })
      .limit(MAX_REVIEW)
      .lean();

    // New cards (reps == 0)
    const news = await Flashcard.find({
      ...baseMatch,
      reps: 0,
    })
      .select("_id question answer folder ease interval reps lapses due")
      .limit(MAX_NEW)
      .lean();
    res.json({review, news});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/review", auth, async (req, res) => {
  try {
    const { cardId, grade } = req.body || {};
    if (!cardId || ![0,1,2,3].includes(grade)) {
      return res.status(400).json({ error: "cardId and grade (0..3) required" });
    }

    // fetch minimal fields needed for scheduling
    const card = await Flashcard.findOne(
      { _id: cardId, user: req.user._id },
      "ease interval reps lapses due"
    );
    if (!card) return res.status(404).json({ error: "not found" });

    const updates = nextSchedule(card, grade, new Date());
    Object.assign(card, updates);
    await card.save();

    // return lightweight payload
    res.json({
      _id: card._id,
      ease: card.ease,
      interval: card.interval,
      reps: card.reps,
      lapses: card.lapses,
      due: card.due,
      lastReviewedAt: card.lastReviewedAt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create a folder
 *     tags: [Folders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *           example:
 *             name: "Biology"
 *     responses:
 *       201:
 *         description: Created folder
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Missing required field(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "name is required"
 *       409:
 *         description: Folder already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "folder exists"
 *       500:
 *         description: Server error
 */
app.post("/api/folders", auth, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const folder = await Folder.create({ name, user: req.user._id }); // {name} same as {name: name}
    res.status(201).json(folder); //returns folder
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "folder exists" });
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/register", async(req, res) => {
  try{
    const{username, password} = req.body;
    if(!username?.trim() || !password?.trim()){
      return res.status(400).json({error:"Username and password required"});
    }

    const exists = await User.findOne({username});
    if(exists){
      return res.status(409).json({error:"Username exists already"});
    }

    const user = new User({username, password});
    await user.save();

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({token, username: user.username});
  } catch(err){
    res.status(500).json({error: "Server error: " + err.message})
  }
});

app.post("/api/login", async(req, res) => {
  try{
    const {username, password} = req.body;
    const user = await User.findOne({username});
    if(!user || !(await user.comparePassword(password))){
      return res.status(401).json({error: "invalid credentials"});
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({token, username: user.username});
  } catch(err){
    res.status(500).json({error: "Server error"});
  }
});
/**
 * @swagger
 * /api/folders/{id}:
 *   patch:
 *     summary: Rename a folder
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Folder ID (Mongo ObjectId)
 *         schema:
 *           type: string
 *           example: "66f1b2a3c4d5e6f7890a1b2c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *           example:
 *             name: "Biology A1"
 *     responses:
 *       200:
 *         description: Updated folder
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Missing required field(s)
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
app.patch("/api/folders/:id", auth, async (req, res) => {
  try {
    const {name, schedule} = req.body || {};
    const update = {};
    if (typeof name === "string" && name.trim() !== "") {
      update.name = name.trim();
    }
    if ("schedule" in req.body) {
      update.schedule = !!req.body.schedule;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const updated = await Folder.findByIdAndUpdate(
      {_id: req.params.id, user: req.user._id}, //finds by id
      update,
      { new: true }   //returns new folder instead of old one
    );
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Delete a folder and its flashcards
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Folder ID (Mongo ObjectId)
 *         schema:
 *           type: string
 *           example: "66f1b2a3c4d5e6f7890a1b2c"
 *     responses:
 *       200:
 *         description: Deletion acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
app.delete("/api/folders/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Flashcard.deleteMany({ folder: id, user: req.user._id});
    const del = await Folder.findByIdAndDelete({_id: id, user: req.user._id});
    if (!del) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/flashcards:
 *   get:
 *     summary: List flashcards
 *     description: Optionally filter by folder using the `folderId` query parameter.
 *     tags: [Flashcards]
 *     parameters:
 *       - in: query
 *         name: folderId
 *         required: false
 *         description: Filter by folder ID (Mongo ObjectId)
 *         schema:
 *           type: string
 *           example: "66f1b2a3c4d5e6f7890a1b2c"
 *     responses:
 *       200:
 *         description: Array of flashcards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flashcard'
 *       500:
 *         description: Server error
 */
app.get("/api/flashcards", auth, async (req, res) => {
  try {
    const q = {};
    if (req.query.folderId) q.folder = req.query.folderId;
    q.user = req.user._id;
    const cards = await Flashcard.find(q).sort({ _id: 1 }).lean();
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/flashcards:
 *   post:
 *     summary: Create a flashcard
 *     tags: [Flashcards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               folder:
 *                 type: string
 *                 description: Folder ID (Mongo ObjectId)
 *           example:
 *             question: "What is ATP?"
 *             answer: "Energy currency of the cell"
 *             folder: "66f1b2a3c4d5e6f7890a1b2c"
 *     responses:
 *       201:
 *         description: Created flashcard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flashcard'
 *       400:
 *         description: Missing required field(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "question, answer, folder required"
 *       500:
 *         description: Server error
 */
app.post("/api/flashcards", auth, async (req, res) => {
  try {
    const { question, answer, folder } = req.body || {};
    if (!question || !answer || !folder)
      return res
        .status(400)
        .json({ error: "question, answer, folder required" });
    const card = await Flashcard.create({ question, answer, folder, user: req.user._id });
    res.status(201).json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/flashcards/{id}:
 *   patch:
 *     summary: Update a flashcard (partial)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Flashcard ID (Mongo ObjectId)
 *         schema:
 *           type: string
 *           example: "66f1b2a3c4d5e6f7890a1b2c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any subset of fields to update
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               folder:
 *                 type: string
 *                 description: Folder ID (Mongo ObjectId)
 *           example:
 *             answer: "Updated answer"
 *     responses:
 *       200:
 *         description: Updated flashcard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flashcard'
 *       404:
 *         description: Flashcard not found
 *       500:
 *         description: Server error
 */
app.patch("/api/flashcards/:id", auth, async (req, res) => {
  try {
    const { question, answer, folder } = req.body || {};
    const card = await Flashcard.findByIdAndUpdate(
      {_id: req.params.id, user: req.user._id},
      {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(folder && { folder }),
      },
      { new: true } // return updated doc
    );
    if (!card) return res.status(404).json({ error: "not found" });
    res.json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/flashcards/{id}:
 *   delete:
 *     summary: Delete a flashcard
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Flashcard ID (Mongo ObjectId)
 *         schema:
 *           type: string
 *           example: "66f1b2a3c4d5e6f7890a1b2c"
 *     responses:
 *       200:
 *         description: Deletion acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Flashcard not found
 *       500:
 *         description: Server error
 */
app.delete("/api/flashcards/:id", auth, async (req, res) => {
  try {
    const del = await Flashcard.findByIdAndDelete({_id: req.params.id, user: req.user._id});
    if (!del) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- DB
const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL && process.env.NODE_ENV !== 'test' ) {
  console.error("MONGO_URL is missing");
  process.exit(1);
}

if(process.env.NODE_ENV !== 'test'){
    mongoose
    .connect(MONGO_URL, { serverSelectionTimeoutMS: 8000 })
    .then(() => console.log("Mongo connected"))
    .catch((err) => {
        console.error("Mongo connection error:", err?.message || err);});
}
// --- HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowed.length ? allowed : true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.use((socket, next) => {
  try {
    // Prefer auth field from client
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});


attachVersus(io);

// --- Start
const PORT = process.env.PORT || 5000;
if(process.env.NODE_ENV !== 'test'){
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}


// graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

module.exports = {app, server};
