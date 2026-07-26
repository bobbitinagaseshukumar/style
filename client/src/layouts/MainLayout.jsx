import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import ParticleCanvas from '../components/common/ParticleCanvas';
import CustomCursor from '../components/common/CustomCursor';
import WhatsAppFloat from '../components/common/WhatsAppFloat';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white text-charcoal-900 font-sans relative overflow-x-hidden">
      <CustomCursor />
      <ParticleCanvas />
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pt-24">
        <Outlet />
      </main>
      <Footer />
      {/* Floating WhatsApp Chat Button — auto-uses admin-configured number */}
      <WhatsAppFloat />
    </div>
  );
};

export default MainLayout;
