import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: "Sustainable Sourcing",
    description: "Ethically sourced beans from regenerative farms worldwide",
    icon: "🌱"
  },
  {
    title: "Nano-Foam Technology",
    description: "Patented microfoam for perfect crema consistency",
    icon: "☕"
  },
  {
    title: "Quantum Roasting",
    description: "AI-optimized roast profiles for peak flavor extraction",
    icon: "🤖"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          className="text-3xl font-bold text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          INNOVATION MEETS TRADITION
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                boxShadow: [
                  "0 0 0px #000000",
                  "0 0 10px #6366f8",
                  "0 0 0px #000000"
                ]
              }}
              whileHover={{ 
                y: -10,
                background: "rgba(99, 102, 241, 0.1)"
              }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
