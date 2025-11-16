import React from "react";
import whatsapp from "../assets/whatsap.png";
import Instagram from "../assets/inta.png";
import Int from "../assets/int.png";
import Foot from "../assets/foot.png";
import MO from "../assets/mo.png";

export default function EnhancedEllectraPage() {
  const handleClick = () => {
    const text = encodeURIComponent('Hello! I am contacting you from your website.');
    const url = `https://wa.me/${+916381733447}?text=${text}`;
    window.open(url, '_blank', 'noopener');
  };
  const handleClickInt = () => {
    window.open("https://www.instagram.com/ellectra_projects/?igsh=MWRqanpycngzazY5cw%3D%3D#", "_blank", "noopener");
  };
  const handleClickWeb = () => {
    window.open("https://www.ellectra.in/", "_blank", "noopener");
  };
  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      <div className="flex justify-between items-center p-4 sm:p-6 md:p-10">
        <img
          src="https://res.cloudinary.com/dosahgtni/image/upload/v1762153393/Ellectra_w01wap.png"
          alt="logo"
          className="h-8 sm:h-10 md:h-12 w-auto"
        />
        <p
          style={{ fontFamily: "Bai Jamjuree, sans-serif" }}
          className="text-sm sm:text-lg md:text-xl lg:text-2xl tracking-widest font-semibold text-gray-700"
        >
          www.ellectra.in
        </p>
      </div>

      <div>
        <div className=" md:hidden lg:hidden sm:flex justify-center items-center -mt-20">
  <img src={MO}  alt="" />
</div>

<div onClick={handleClickWeb} className="flex md:hidden lg:hidden sm:flex border rounded-3xl border-gray-300 shadow-md px-4 w-full  lg:w-2/3 justify-between  mb-10 p-3 items-center cursor-pointer hover:shadow-lg transition-shadow">
  <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-lg sm:text-xl md:text-xl lg:text-2xl text-gray-400 truncate">
    https://www.ellectra.in
  </p>
  <img src={Int} className="w-8 h-8  flex-shrink-0" alt="Website" />
</div>
        <p
          style={{ fontFamily: "Bai Jamjuree, sans-serif" }}
          className="text-center font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#D21D29] to-[#FBDD31] text-[60px] sm:text-[100px] md:text-[150px] lg:text-[200px] xl:text-[300px] leading-none px-4"
        >
          ELLECTRA
        </p>
        <div className="w-full h-[3px] sm:h-[4px] md:h-[5px] mt-5 sm:mt-7 md:mt-10 bg-white"></div>
      </div>

      <div className="flex flex-col lg:flex-row px-4 sm:px-6 md:px-10 gap-6 md:gap-10 mt-6 md:mt-10 justify-between">

        <div className="leading-none pt-4 sm:pt-6 md:pt-10 text-center lg:text-left">
          <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-[30px] sm:text-[40px] md:text-[50px] text-gray-400 tracking-wider">
            Trusted
          </p>
          <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-[35px] sm:text-[45px] md:text-[60px] text-gray-600 tracking-wider">
            Electronic
          </p>
          <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-[40px] sm:text-[55px] md:text-[70px] text-gray-800 tracking-wider">
            Solutions.
          </p>
        </div>

        <div className="flex flex-col justify-between w-full gap-4 sm:gap-5">

          <div className="z-100 flex  xs:flex-row gap-3 sm:gap-5 justify-center lg:justify-end mt-4 sm:mt-6 md:mt-10">
            <div onClick={handleClick} className="border rounded-3xl border-gray-300 shadow-md px-4 sm:px-5 flex gap-2 sm:gap-3 p-2 sm:p-3 items-center cursor-pointer hover:shadow-lg transition-shadow">
              <img src={whatsapp} className="w-8 h-8 sm:w-10 sm:h-10" alt="WhatsApp" />
              <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-md sm:text-md md:text-2xl">
                Whatsapp
              </p>
            </div>

            <div onClick={handleClickInt} className="border rounded-3xl border-gray-300 shadow-md px-4 sm:px-5 flex gap-2 sm:gap-3 p-2 sm:p-3 items-center cursor-pointer hover:shadow-lg transition-shadow">
              <img src={Instagram} className="w-8 h-8 sm:w-10 sm:h-10" alt="Instagram" />
              <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-md sm:text-md md:text-2xl">
                Instagram
              </p>
            </div>
          </div>

          <div onClick={handleClickWeb} className="z-100 hidden md:flex lg:flex justify-center lg:justify-end">
            <div className="border rounded-3xl border-gray-300 shadow-md px-4 sm:px-5 w-full lg:w-2/3 flex justify-between gap-2 sm:gap-3 p-2 sm:p-3 items-center cursor-pointer hover:shadow-lg transition-shadow">
              <p style={{ fontFamily: "Bai Jamjuree,sans-serif" }} className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-400 truncate">
                https://www.ellectra.in
              </p>
              <img src={Int} className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" alt="Website" />
            </div>
          </div>

        </div>
      </div>

      <div className="flex overflow-hidden -mt-10 md:-mt-10 lg:-mt-20 ">
        <img src={Foot} className="w-full md:w-auto" alt="Footer decoration" />
        <img src={Foot} className="hidden md:block" alt="Footer decoration" />
      </div>

    </div>
  );
}