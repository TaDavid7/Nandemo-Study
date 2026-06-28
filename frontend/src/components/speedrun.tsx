import React, { useState, useEffect, FormEvent } from "react";

// Define the Flashcard type
export interface FlashcardType {
  _id: string;
  question: string;
  answer: string;
  folder: string;
}

// Define the props type for speedrun
interface QuizGameProps {
  flashcards: FlashcardType[];
  time: string;
  onQuit: () => void;
}

const Speedrun: React.FC<QuizGameProps> = ({ flashcards, time, onQuit }) => {
    const [current, setCurrent] = useState<number>(0);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [score, setScore] = useState<number>(0);
    const [incorrect, setIncorrect] = useState<number>(0);
    const [timer, setTimer] = useState<number>(20);
    const [answered, setAnswered] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [showResults, setShowResults] = useState(false);
    const [shuffledFlashcards, setShuffledFlashcards] = useState<FlashcardType[]>([]);

    const reset = () => {
      window.location.reload();
    }
    const results = () => {
      return(
      <div className = "border-2 border-gray-200 rounded-2xl p-6 sm:p-8 md:p-10 max-w-5xl mx-auto">
        <div className="p-6 space-y-6">
          <h2 className = "text-2xl text-left font-bold">Speedrun Complete!</h2>
          <h2 className = "text-lg font-medium">Ammount correct: {score}</h2>
          <h2 className = "text-lg font-medium">Amount incorrect: {incorrect}</h2>
          <button 
            onClick={reset}
            className = "bg-blue-400 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition"
          >Take Again</button> &nbsp; &nbsp;
          <button 
            className = "bg-red-400 text-white px-4 py-2 rounded-2xl hover:bg-red-600 transition"
            onClick={onQuit} style={{ marginTop: "1rem" }}>Exit</button>
        </div>
      </div>
      )
    };

    const shuffleArray = (arr: FlashcardType[]) => {
      //Fisher-Yates Shuffle
      const copy = [...arr];
      for(let i = copy.length -1; i > 0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    
    if (!flashcards.length){
      return (
        <div>
            No flashcards available.
            <br></br>
            <button 
            className = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={onQuit} style={{ marginTop: "1rem" }}>Quit Speedrun</button>
            
        </div>);
    }

    //shuffle cards
    useEffect(() => {
      setShuffledFlashcards(shuffleArray(flashcards));
    },[refresh, flashcards])

    //start timer
    useEffect( () => {
      if(showResults) return;
      const id = setInterval(() => {
        setTimer(t => Math.max(0, t-1));
      }, 1000);
      return () => clearInterval(id);
    }, [showResults]);

    useEffect(() => {
        if (timer === 0) {
            setFeedback(`Time's up!`);
            setAnswered(true);
            
        }
    }, [timer]);


    useEffect(() => {
      const timeofsec = Number(time.trim());
      //checks if valid number and positive
      if(Number.isFinite(timeofsec) && (timeofsec > 0)){
        setTimer(timeofsec);
      } 
      else{
        setTimer(80);
      }
        
    },[]);
    
    useEffect(() => {
        setAnswered(false);
        setUserAnswer("");
    }, [current]);


  // Handle answer submission
  const checkAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (answered || timer === 0) return; // Prevent double answers or time's up

    const correct = shuffledFlashcards[current].answer.trim().toLowerCase();
    const guess = userAnswer.trim().toLowerCase();

    if (guess === correct) {
      setFeedback("Correct!");
      setScore(score + 1);
    } else {
      console.log("cat");
      setFeedback(`Incorrect. The answer was: ${shuffledFlashcards[current].answer}`);
      setIncorrect(incorrect + 1);
    }
    setAnswered(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (current == shuffledFlashcards.length-1){
      setCurrent(0);
      setRefresh((r) => !r);
      setFeedback("");
    }
    else{
        handleNext();
    }
  };

  const handleNext = () => {
    setFeedback("");
    setCurrent(current + 1);
  };




  return (
    <div>
      {!showResults ? (
      <div className = "border-2 border-gray-200 rounded-2xl p-6 sm:p-8 md:p-10 max-w-5xl mx-auto">
        <div className="p-6 space-y-6">
        <div className = "text-2xl text-left font-bold">Speedrun Mode</div>
        <strong>Time Left:</strong> {timer} seconds

        <br></br>
        <div className = "text-center">
          <p className = "text-lg font-medium"><strong>Question:</strong> {shuffledFlashcards[current]?.question}</p>
          <form onSubmit={checkAnswer}>
            <input
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Type your answer"
              className="w-40 px-2 py-1 border-2 border-gray-300 rounded-lg 
                    text-m bg-gray-50 outline-none transition duration-300
                    focus:border-blue-500 focus:shadow-md placeholder-gray-400 italic"
              autoFocus
            />
          </form>
        </div>    
        <div className = "my-2 text-center min-h-[2rem]">{feedback}</div>
        
        <div style = {{textAlign: "center"}}>
          <button 
            className = "bg-blue-400 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition"
            onClick={() => setShowResults(true)} style={{ marginTop: "1rem" }}>Finish </button> &nbsp; &nbsp;
          <button 
            className = "bg-red-400 text-white px-4 py-2 rounded-2xl hover:bg-red-600 transition"
            onClick={onQuit} style={{ marginTop: "1rem" }}>Exit</button>
        </div>
        </div>

      </div>
      ) : (null)}
      {showResults ? results() : null}
      <div style = {{textAlign: "center"}}>
      
      </div>
    </div>
  );
};

export default Speedrun;
