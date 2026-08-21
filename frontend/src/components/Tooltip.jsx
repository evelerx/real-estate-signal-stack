export default function Tooltip({ text, children }) {
  return (
    <div className="relative group inline-block">
      {children}

      <div className="
        absolute
        left-1/2
        -translate-x-1/2
        bottom-full
        mb-2
        hidden
        group-hover:block
        whitespace-nowrap
        bg-black
        text-gray-200
        text-xs
        px-2
        py-1
        rounded
        shadow-lg
        z-50
      ">
        {text}
      </div>
    </div>
  );
}
