"use client";

type SelectorNavbarProps = {
  names: string[];
  selected: string;
  setSelected: (name: string) => void;
}

export default function ButtonsBlock({ names, selected, setSelected }: SelectorNavbarProps) {
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
              w-full py-3 font-semibold rounded-md border transition
              ${
                isActive
                  ? "text-white border-white"
                  : "bg-white text-black border-black hover:bg-[#141F2E] hover:border-white hover:text-white"
              }
            `}
          >
            {name}
          </button>
        );
      })}
    </div>
  )
}