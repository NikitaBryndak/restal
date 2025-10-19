"use client";
import Link from "next/link";

type Article = {

  title: string,
  description: string,
  image: string,
  link: string,
  tag: string,
  content?: string

}

type ArticleProps = {
  filteredItems: Article[]
}

export default function Article({ filteredItems }: ArticleProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">

      
      {filteredItems.map((item) => (
        <Link
          key={item.title}
          href={item.link}
          className="group cursor-pointer block transform transition-transform duration-700 ease-out hover:scale-[1.04]"
        >
          <div
            className="relative p-4 rounded-2xl text-center overflow-hidden h-[400px]"
                      //  bg-white/10 backdrop-blur-sm
                      //  shadow-[0_8px_20px_rgba(0,0,0,0.4)] 
                      //  hover:shadow-[0_10px_35px_rgba(59,130,246,0.6)]
                      //  transition-shadow duration-700 ease-out
          >

            {/* Inner canvas area (article content) */}
            <div className="p-5 m-2 rounded-md shadow-inner flex flex-col h-full relative z-10">
              <h3 className="text-[29px] text-lg font-bold text-white-900 mb-1">
                {item.title}
              </h3>
            </div>

            <div > {/*className="flex h-full relative z-10" */}
              <p > {/*className="text-[16px] leading-snug text-white font-bold bg-black/60 px-[6px] py-[10px] my-[90px] rounded-[6px] text-left">*/}
                {item.description}
              </p>
            </div>

            {/* Image inside the frame */}
            <img
              src={item.image}
              alt={item.title}
              className="absolute top-0 left-0 w-full h-full object-cover opacity-70 pointer-events-none"
            />

            {/* Gradient overlay from transparent top → dark bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black/80 backdrop-blur-[1.5px]" /> 
          </div>
        </Link>
      ))}
    </div>
  );
}