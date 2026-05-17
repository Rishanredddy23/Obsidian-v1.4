import React from 'react';
import { motion } from 'framer-motion';

const menuItems = [
  {
    name: "Quantum Cold Brew",
    description: "Nitro-infused cold extraction with molecular cascading",
    price: "6.95",
    image: "https://images.unsplash.com/photo-1514432414037-ca7a0064b992?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Hologram Latte",
    description: "Chromatic foam art with temperature-reactive pigments",
    price: "7.50",
    image: "https://images.unsplash.com/photo-1559496795-90c280d109ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Nebula Cappuccino",
    description: "Cosmic dust infusion with zero-gravity foam texture",
    price: "8.25",
    image: "https://images.unsplash.com/photo-1511472994993-493849171b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

const MenuPreview = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          className="text-3xl font-bold text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          SIGNATURE EXPERIMENTS
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              className="bg-gray-800/30 backdrop-blur rounded-2xl overflow-hidden border border-gray-700"
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                borderColor: "#818cf8"
              }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                background: [
                  "linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(17, 24, 39, 0.3) 100%)",
                  "linear-gradient(135deg, rgba(55, 48, 160, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)"
                ]
              }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{item.name}</h3>
                <p className="text-gray-300 text-center mb-4">{item.description}</p>
                <p className="text-center text-lg font-bold">${item.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuPreview;
