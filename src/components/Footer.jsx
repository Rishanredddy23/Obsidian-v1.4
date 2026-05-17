import React from 'react';

const Footer = () => {
  return (
    <footer className="py-10 text-center border-t border-gray-800">
      <p>© {new Date().getFullYear()} Nexus Brew. All rights reserved.</p>
      <p className="text-gray-500 text-sm mt-2">Crafting the future of coffee, one cup at a time.</p>
    </footer>
  );
};

export default Footer;
