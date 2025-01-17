import { useCallback, useEffect, useRef, useState } from "react";
import { Row, RowState } from "./Row";
import dictionary from "./dictionary.json";
import { Clue, clue } from "./clue";
import { Keyboard } from "./Keyboard";
import { seed } from "./util";

enum GameState {
  Playing,
  Won,
  Lost,
}

interface GameProps {
  maxGuesses: number;
  hidden: boolean;
  colorBlind: boolean;
  keyboardLayout: string;
}

let initChallenge = "";

function Game(props: GameProps) {
  const [gameState, setGameState] = useState(GameState.Playing);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [challenge, setChallenge] = useState<string>(initChallenge);
  const target = "burnaboy"; // "sautisol";
  const wordLength = target.length;
  const gameNumber = 1;
  const currentSeedParams = useCallback(
    () => `?seed=${seed}&length=${wordLength}&game=${gameNumber}`,
    [gameNumber, wordLength]
  );
  useEffect(() => {
    if (seed) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + currentSeedParams()
      );
    }
  }, [wordLength, gameNumber, currentSeedParams]);
  const tableRef = useRef<HTMLTableElement>(null);
  const startNextGame = useCallback(() => {
    if (challenge) {
      // Clear the URL parameters:
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setChallenge("");
    setGuesses([]);
    setCurrentGuess("");
    setGameState(GameState.Playing);
  }, [challenge]);

  const [showCongratulations, setShowCongratulations] = useState(false);

  const onKey = useCallback(
    (key: string) => {
      if (gameState !== GameState.Playing) {
        if (key === "Enter") {
          startNextGame();
        }
        return;
      }
      if (guesses.length === props.maxGuesses) return;
      if (/^[a-z]$/i.test(key)) {
        setCurrentGuess((guess) =>
          (guess + key.toLowerCase()).slice(0, wordLength)
        );
        tableRef.current?.focus();
      } else if (key === "Backspace") {
        setCurrentGuess((guess) => guess.slice(0, -1));
      } else if (key === "Enter") {
        if (currentGuess.length !== wordLength) {
          window.alert("Too short, shorty 😘");
          return;
        }
        if (!dictionary.includes(currentGuess)) {
          window.alert("Not a valid word ☹️");
          return;
        }
        setGuesses((guesses) => guesses.concat([currentGuess]));
        setCurrentGuess((_guess) => "");

        if (currentGuess === target) {
          setShowCongratulations(true);
        }
      }
    },
    [
      currentGuess,
      gameState,
      guesses.length,
      props.maxGuesses,
      startNextGame,
      wordLength,
    ]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        onKey(e.key);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [currentGuess, gameState, onKey]);

  let letterInfo = new Map<string, Clue>();
  const tableRows = Array(props.maxGuesses)
    .fill(undefined)
    .map((_, i) => {
      const guess = [...guesses, currentGuess][i] ?? "";
      const cluedLetters = clue(guess, target);
      const lockedIn = i < guesses.length;
      if (lockedIn) {
        for (const { clue, letter } of cluedLetters) {
          if (clue === undefined) break;
          const old = letterInfo.get(letter);
          if (old === undefined || clue > old) {
            letterInfo.set(letter, clue);
          }
        }
      }
      return (
        <Row
          key={i}
          wordLength={wordLength}
          rowState={
            lockedIn
              ? RowState.LockedIn
              : i === guesses.length
              ? RowState.Editing
              : RowState.Pending
          }
          cluedLetters={cluedLetters}
        />
      );
    });

  return (
    <div className="Game" style={{ display: props.hidden ? "none" : "block" }}>
      <style>
        {`@keyframes bouncy {
            0% { transform: rotate(0deg) translateY(0); }
            25% { transform: rotate(-10deg) translateY(0); }
            50% { transform: rotate(0deg) translateY(0); }
            75% { transform: rotate(10deg) translateY(0); }
            100% { transform: rotate(0deg) translateY(0); }
          }`}
      </style>
      {showCongratulations && (
        <div style={{ padding: "1em 0" }}>
          <strong>YAYYYYY!!!!!!</strong> We’re going to{" "}
          <strong>BURNA BOY</strong> on Saturday 17 June in Arnhem (The
          Netherlands) 🥳 🥳 🥳
        </div>
      )}
      <table
        className="Game-rows"
        tabIndex={0}
        aria-label="Table of guesses"
        ref={tableRef}
      >
        <tbody>{tableRows}</tbody>
      </table>
      <Keyboard
        layout={props.keyboardLayout}
        letterInfo={letterInfo}
        onKey={onKey}
      />
      {showCongratulations && (
        <div
          style={{
            animation: "bouncy 1s infinite",
            animationTimingFunction: "linear",
            transformOrigin: "50% 100%",
            position: "fixed",
            bottom: -130,
            left: 0,
            width: "100%",
            textAlign: "center",
          }}
        >
          <img alt="Burna Boy" src="/hello-wordl/burna-boy.png" />
        </div>
      )}
    </div>
  );
}

export default Game;
