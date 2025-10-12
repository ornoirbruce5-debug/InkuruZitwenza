// products.js
// Minimal starter catalogue; scale to 100+ items by extending JB_PRODUCTS.
const JB_PRODUCTS = [
  {
    id: 1,
    name: "Amata Inyange 1L",
    category: "amata",
    price: 2500,
    stock: 24,
    desc: "Amata meza ya 1L.",
    image: "assets/products/amata-1l.jpg"
  },
  {
    id: 2,
    name: "Yusura Soda",
    category: "Ibinyobwa",
    price: 1500,
    stock: 40,
    desc: "Soda ikonje, biryohera.",
    image: "assets/products/yusura-soda.jpg"
  },
  {
    id: 3,
    name: "Isabune Isuku Bar",
    category: "isuku",
    price: 1800,
    stock: 32,
    desc: "Isabune yo gukaraba.",
    image: "assets/products/isabune-bar.jpg"
  },
  {
    id: 4,
    name: "Amata Fresh 500ml",
    category: "amata",
    price: 1200,
    stock: 18,
    desc: "Amata fresh 500ml.",
    image: "assets/products/amata-500ml.jpg"
  },
  {
    id: 5,
    name: "Sprit Orange 500ml",
    category: "Ibinyobwa",
    price: 1300,
    stock: 50,
    desc: "Ibinyobwa biryohera orange.",
    image: "assets/products/sprit-orange.jpg"
  }
];

// Predefined bundles
const JB_BUNDLES = {
  "Isuku Starter": {
    name: "Isuku Starter",
    ids: [3],
    bundlePrice: 1600
  },
  "Ibinyobwa Mini": {
    name: "Ibinyobwa Mini",
    ids: [2,5],
    bundlePrice: 2600
  }
};

export { JB_PRODUCTS, JB_BUNDLES };
