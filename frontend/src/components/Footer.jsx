
import {Textfit} from "react-textfit"

export default function Footer({ clientcompanyname, client_slogan }){
    return(
        <div className="w-full bg-black overflow-hidden">
            <div className="flex flex-col md:flex-row lg:flex-row justify-between ">
            <div className="flex flex-col">
            <div className="md:pt-20 lg:pt-20 md:px-20 lg:px-20 pt-10 px-10 sm:pt-10 sm:px-10">
                <h1 className="text-white font-bold md:text-2xl lg:text-2xl text-lg">Ellectra</h1>
                <p className="text-white pt-4 text-xs md:text-sm lg:text-sm">your go-to hub for quality electronic parts, boards, and tools </p>
                <p className="text-white pt-1 text-xs md:text-sm lg:text-sm">empowering students, engineers, and creators to innovate</p>
                <p className="text-white pt-4 text-xs md:text-sm lg:text-sm">&copy; 2025 Ellectra Electronics. All rights reserved.</p>
            </div>
            <div className="flex md:px-20 lg:px-20 px-10 sm:px-10 pt-4 gap-3">
                <button 
                    className="rounded-full border border-gray-300 bg-white px-1 py-1 md:p-2 lg:p-2">
                    <img src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761970601/x_d5gggl.png" alt="x" className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"/>
                </button>
                <button 
                    className="rounded-full border border-gray-300 bg-white px-1 py-1 md:p-2 lg:p-2">
                    <img src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761970601/linkedin_ysc2fj.png" alt="x" className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"/>
                </button>
                <button 
                    className="rounded-full border border-gray-300 bg-white px-1 py-1 md:p-2 lg:p-2">
                    <img src="https://res.cloudinary.com/dqhylblrx/image/upload/v1761970601/insta_ay0lu6.png" alt="x" className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"/>
                </button>
            </div>
            </div>
            <div className="flex flex-col md:flex-row lg:flex-row ">
            <div className="md:pt-20 lg:pt-20 md:px-20 lg:px-20 pt-5 px-10 sm:pt-10 sm:px-10">
                <h1 className="text-white font-bold text-lg lg:text-2xl md:text-2xl">Contact</h1>
                <p className="text-white pt-4 text-xs md:text-sm lg:text-sm">Email: support@ellectra.com</p>
                <p className="text-white pt-1 text-xs md:text-sm lg:text-sm">Phone: +91 98765 43210</p>
                <p className="text-white pt-1 text-xs md:text-sm lg:text-sm">Address: 45 Tech Park Road, Bangalore, India</p>
            </div>
            
            </div>
            </div>
            <div className="flex justify-center overflow-hidden md:-mb-7 lg:-mb-7  pt-10">
                <div className="w-full max-w-7xl">
                <Textfit 
                max={380}
                mode="single"
                style={{
                    WebkitMaskImage: 'linear-gradient(to top, transparent 20%, black 80%)',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskImage: 'linear-gradient(to top, transparent 0%, black 110%)',
                    maskRepeat: 'no-repeat',
                    maskSize: '100% 100%'
                }}
                className="text-[#4A4957] text-[380px] font-[900] leading-none text-center">ELLECTRA</Textfit>
                </div>
            </div>
        </div>
    );
}