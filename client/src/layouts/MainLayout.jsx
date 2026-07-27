import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import ParticleCanvas from '../components/common/ParticleCanvas';
import CustomCursor from '../components/common/CustomCursor';
import WhatsAppFloat from '../components/common/WhatsAppFloat';
import MobileBottomNav from '../components/common/MobileBottomNav';
import ChatbotWidget from '../components/common/ChatbotWidget';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white text-charcoal-900 font-sans relative overflow-x-hidden">
      <CustomCursor />
      <ParticleCanvas />
      <Navbar />
      <main className="flex-grow w-full relative z-10 pt-16 sm:pt-20 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <MobileBottomNav />
      <ChatbotWidget />
    </div>
  );
};

export default MainLayout;
