export default function TypingIdicator() {
  return (
    <div className="flex gap-1">
      <div
        className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce`}
      ></div>
      <div
        className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce [animation-delay:0.2s] `}
      ></div>
      <div
        className={`w-1.5 h-1.5 rounded-full bg-green-500  animate-bounce [animation-delay:0.4s] `}
      ></div>
    </div>
  );
}
