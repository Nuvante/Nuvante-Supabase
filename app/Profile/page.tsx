"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Alert from "@/components/Alert";

const logo = "/logo.png";

interface ProfileResponse {
  firstName: string;
  lastName: string;
  address: string;
  wishlist: { id: string }[];
  cart: { id: string; quantity: number }[];
}

interface AlertState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

const Page = () => {
  const { isSignedIn } = useUser();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [globalEmail, setGlobalEmail] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = useCallback((message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  const custom_propagation_flow = useCallback(async () => {
    try {
      const response = await axios.get<ProfileResponse>("/api/propagation_client/");
      if (response.status === 200 && response.data) {
        setFirstName(response.data.firstName || "");
        setLastName(response.data.lastName || "");
        setAddress(response.data.address || "");
        setLoaded(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert("There was an error fetching the profile. Please try refreshing", "error");
      setLoaded(false);
    }
  }, [showAlert]);

  const fetch_current_email = useCallback(async () => {
    try {
      const response = await axios.get<string>("/api/emailify/");
      if (response.status === 200) {
        setGlobalEmail(response.data || "");
      }
    } catch (error) {
      console.error("Error fetching email:", error);
      showAlert("Failed to fetch email", "error");
    }
  }, [showAlert]);

  const lazily_update_database = useCallback(async () => {
    try {
      // First get the current email
      const emailResponse = await axios.get<string>("/api/emailify/");
      if (emailResponse.status !== 200) {
        throw new Error("Failed to get user email");
      }

      // Optimistically update the UI
      const originalFirstName = firstName;
      const originalLastName = lastName;
      const originalAddress = address;

      const response = await axios.post("/api/populate/", {
        email: emailResponse.data,
        first_name: firstName,
        last_name: lastName,
        address: address,
      });

      if (response.status === 200) {
        showAlert("Profile updated successfully!", "success");
      } else {
        // Revert optimistic update on failure
        setFirstName(originalFirstName);
        setLastName(originalLastName);
        setAddress(originalAddress);
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile changes:", error);
      showAlert("Failed to save profile changes. Please try again.", "error");
      // Refresh the profile data to ensure consistency
      await custom_propagation_flow();
    }
  }, [firstName, lastName, address, custom_propagation_flow, showAlert]);

  useEffect(() => {
    if (isSignedIn) {
      fetch_current_email();
      custom_propagation_flow();
    }
  }, [isSignedIn, fetch_current_email, custom_propagation_flow]);

  if (!isSignedIn) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <p>Please sign in to view your profile.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
        />
      )}
      <div className="p-4">
        <div className="mt-6 ml-4 lg:ml-32">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {!loaded && (
          <motion.div
            className="w-fit mx-auto mt-20"
            animate={{ rotate: 360, transition: { duration: 1.5 } }}
          >
            <Image src={logo} alt="preloader" width={60} height={60} />
          </motion.div>
        )}

        {loaded && (
          <div className="flex flex-col lg:flex-row ml-4 lg:ml-32 mt-8 lg:mt-24">
            <div className="flex flex-col">
              <div className="flex flex-col">
                <h1 className="font-medium">Manage My Account</h1>
                <div className="flex flex-col ml-4 lg:ml-10 pt-4 font-normal">
                  <div className="text-[#DB4444] font-normal cursor-pointer">
                    My Profile
                  </div>
                </div>
              </div>
              <div className="pt-10 font-normal gap-3 flex flex-col">
                <Sidebar />
              </div>
            </div>

            <div className="flex flex-col w-auto lg:w-[870px] pb-10 rounded-sm border lg:ml-32 bg-[#FFFFFF]">
              <div className="mt-8 lg:mt-[40px] ml-4 lg:ml-[80px] h-[28px] w-[155px]">
                <h1 className="font-medium text-[#DB4444]">Edit Your Profile</h1>
              </div>
              <div className="flex flex-col lg:flex-row ml-4 lg:ml-[80px] mt-8">
                <div className="w-full lg:w-[330px] h-[62px]">
                  <h1 className="font-normal">First Name</h1>
                  <input
                    className="mt-1 p-2 w-full lg:w-[330px] h-[50px] bg-[#F5F5F5] rounded-sm placeholder:pl-3"
                    type="text"
                    placeholder="Daksh"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="w-full lg:w-[330px] h-[62px] mt-4 lg:mt-0 lg:ml-10">
                  <h1 className="font-normal">Last Name</h1>
                  <input
                    className="mt-1 p-2 w-full lg:w-[330px] h-[50px] bg-[#F5F5F5] rounded-sm placeholder:pl-3"
                    type="text"
                    placeholder="XYZ"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col lg:flex-row ml-4 lg:ml-[80px] mt-8">
                <div className="w-full lg:w-[330px] h-[62px]">
                  <h1 className="font-normal">Email</h1>
                  <input
                    className="mt-1 lg:w-[330px] p-2 h-[50px] bg-[#F5F5F5] rounded-sm placeholder:pl-3"
                    type="text"
                    placeholder="xyz@gmail.com"
                    value={globalEmail}
                    readOnly
                  />
                </div>
                <div className="w-auto lg:w-[330px] h-[62px] mt-4 lg:mt-0 lg:ml-10">
                  <h1 className="font-normal">Address</h1>
                  <input
                    className="mt-1 p-2 w-full lg:w-[330px] h-[50px] bg-[#F5F5F5] rounded-sm placeholder:pl-3"
                    type="text"
                    placeholder="Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-row justify-end mt-10">
                <button className="mr-4 lg:mr-6">Cancel</button>
                <button
                  className="bg-[#DB4444] w-[250px] h-[56px] font-medium rounded-sm text-white mr-4 lg:mr-[80px]"
                  onClick={lazily_update_database}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Page;
