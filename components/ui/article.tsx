"use client";
import Link from "next/link";

type ArticleProps = {
  data:{
    title: string,
    description: string,
    image: string,
    link: string,
    tag: string,
    content?: string
  }
}

export default function Article({ data }: ArticleProps) {
  console.log(data.description)
  return (
        <Link
          key={data.title}
          href={data.link}
          className="group cursor-pointer block transform transition-transform duration-600 ease-out hover:scale-[1.04]"
        >
  
          <div className="relative bg-white p-0 rounded-2xl overflow-hidden h-[400px] border hover:border-4 border-transparent hover:border-accent shadow-[0_8px_40px_5px_rgba(0,0,0,0.35)] hover:shadow-accent transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">

  {/* <div className="relative bg-white p-0 rounded-2xl overflow-hidden h-[400px] border border-transparent shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:border-accent hover:shadow-accent transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform group-hover:scale-[1.04]"> */}
    {/* ...rest of your content */}
  

        {/* Image takes up half the card height */}
        <div className="relative h-5/7 w-full overflow-hidden">
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Title on top of image */}
          <h3 className="absolute top-4/5 left-4 text-[25px] font-bold text-white z-10 drop-shadow-md">
            {data.title}
          </h3>

        </div>


        {/* Text takes the remaining half */}
        <div className="flex flex-col justify-between pb-5 pt-2 pl-5 pr-5 text-left bg-white/90 backdrop-blur-sm">
          <p className="text-[15px] text-gray-700 flex-grow pointer-events-none">{data.description}</p>
          <div className="absolute -top-10 left-0 w-full h-10 bg-gradient-to-b from-transparent to-white/100 pointer-events-none" />
          <div className="flex items-center gap-1 text-accent font-semibold mt-3">
            <span className="group-hover:underline transition">Tap to read more</span>
            <span className="translate-y-[1px]">→</span>
          </div>
        </div>

      </div>
    </Link>
  )
}