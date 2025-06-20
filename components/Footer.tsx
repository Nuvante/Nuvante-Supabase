"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useAlert } from "@/context/AlertContext";
import { useRouter } from "next/navigation";

const gram_icon = "/instagram.svg";
const linkedin_icon = "/linkedin.svg";
const caret_right = "/caret-right.svg";

export default function Footer() {
  const { isSignedIn } = useUser();
  const { showAlert } = useAlert();
  const router = useRouter();

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isSignedIn) {
      showAlert("You are already signed in", "info");
    } else {
      router.push("/sign-in");
    }
  };

  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isSignedIn) {
      router.push("/Profile");
    } else {
      showAlert("Please sign in to access your profile", "warning");
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    }
  };

  return (
    <footer className="bg-black text-white py-20 mt-40">
      <div className="w-[96%] mx-auto flex lg:flex-row flex-wrap justify-between px-2  lg:gap-10 gap-10">
        <div className="flex flex-col md:w-[30%]">
          <h3 className="font-semibold text-2xl">Nuvante</h3>
          <p className="text-[16px] mt-3">
            Elevate Your Style with The NUVANTE
            <br />
          </p>
          <p className="mt-3 mb-5 text-[13px]">
            Experience unparalleled quality, because you deserve nothing but the
            best. Embark on this journey where your unique style intersects with
            our passion, enabling you to flaunt the classiest products and
            services available. Discover your next favorite today!
          </p>
          <div className="items-center border w-fit border-white rounded-md overflow-hidden hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3  outline-none w-[200px] bg-black text-white text-sm"
            />
            <button className="p-3 bg-white text-black">
              <Image
                src={caret_right}
                width={26}
                height={26}
                alt="caret"
              ></Image>
            </button>
          </div>
          <div className="flex gap-6 mt-6 text-xl">
            <a
              href="https://www.instagram.com/nuvante.in/"
              className="hover:text-gray-500"
            >
              <Image
                src={gram_icon}
                alt="gram_icon_footer"
                width={25}
                height={25}
              ></Image>
            </a>
          </div>
        </div>

        {/* Support Section */}
        <div className=" flex flex-col gap-3">
          <h3 className="font-semibold text-lg">Support</h3>
          <p className="text-gray-400">New Delhi, India.</p>
          <p className="text-gray-400">support@nuvante.in</p>
          <p className="text-gray-400">+91 9899044148</p>
        </div>

        <div className=" flex flex-col gap-6">
          <h3 className="font-semibold text-lg">Account</h3>
          <ul className="text-gray-400 flex flex-col gap-2">
            <li>
              <Link href="/Profile" onClick={handleProfileClick} className="hover:text-white">
                My Account
              </Link>
            </li>
            <li>
              <Link href="#" onClick={handleLoginClick} className="hover:text-white">
                Login / Register
              </Link>
            </li>
            <li>
              <Link href="/Cart" className="hover:text-white">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/Wishlist" className="hover:text-white">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/Products" className="hover:text-white">
                Shop
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Link Section */}
        <div className="  flex flex-col gap-3">
          <h3 className="font-semibold text-lg">Quick Link</h3>
          <ul className="text-gray-400 flex flex-col gap-2">
            <li>
              <Link href="/support" className="hover:text-white">
                Support
              </Link>
            </li>
            <li>
              <Link href="/Contact" className="hover:text-white">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/delivery-policy" className="hover:text-white">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-and-cancellation" className="hover:text-white">
                Return Policy
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-6">
          <h3 className="font-semibold text-lg">Our Commitment</h3>
          <ul className="text-gray-400 flex flex-col gap-2">
            <li>
              <p>✓ 100% Satisfaction Guarantee</p>
            </li>
            <li>
              <p>✓ Customer Support</p>
            </li>
            <li>
              <p>✓ Premium Quality Products</p>
            </li>
            <li>
              <p>✓ Secured Transactions</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-gray-500 text-sm mt-8">
        © Copyright. All rights reserved.
      </div>
    </footer>
  );
}
