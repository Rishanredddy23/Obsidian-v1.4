import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="max-w-6xl mx-auto text-center z-10">
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            textShadow: ["0 0 0px #6366f1", "0 0 10px #818cf8", "0 0 20px #818cf8", "0 0 30px #818cf8"]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          NEXUS BREW
        </motion.h1>
        
        <motion.p 
          className="text-xl max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Experience the future of coffee with our premium blends crafted using 
          cutting-edge roasting technology and sustainable practices.
        </motion.p>
        
        <motion.div
          className="mb-12 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              "0 0 5px #4f46e5",
              "0 0 15px #6366f8",
              "0 0 25px #818cf8"
            ]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-1 rounded-full">
            <img 
              src="https://images.unsplash.com/photo-1501426026662-9fbaa0f9d5d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Futuristic Coffee" 
              className="h-64 w-64 md:h-80 md:w-80 rounded-full object-cover"
            />
          </div>
        </motion.div>
        
        <motion.button
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-lg font-bold tracking-wider shadow-2xl"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 20px #818cf8"
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            boxShadow: [
              "0 0 5px #4f46e5",
              "0 0 15px #6366f8",
              "0 0 25px #818cf8"
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          EXPLORE MENU
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
