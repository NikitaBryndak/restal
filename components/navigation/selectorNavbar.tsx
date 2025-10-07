"use client";
export default function ButtonsBlock({ names, selected, setSelected }) {
  return (
    // Buttons filling full width
    <div className="grid grid-cols-5 gap-4 w-full mb-10">
      {names.map((name) => {
        const isActive = selected === name; // checks if current button is active

        return (
          <button
            key={name}
            onClick={() => setSelected(name)} // sets selected button on click
            className={`
              w-full py-3 font-semibold rounded-md border border-black transition
              ${
                isActive
                  ? "bg-[#0099ff] text-white"
                  : "bg-white text-black hover:bg-[#0099ff] hover:text-white"
              }
            `}
          >
            {name}
          </button>
        );
      })}
    </div>
  );