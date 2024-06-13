const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function validateDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  
  if (!name || name === "") {
    return res.status(400).json({ error: "Dish must include a name" });
  }
  if (!description || description === "") {
    return res.status(400).json({ error: "Dish must include a description" });
  }
  if (!image_url || image_url === "") {
    return res.status(400).json({ error: "Dish must include an image_url" });
  }
  if (!price || typeof price !== "number" || price <= 0) {
    return res.status(400).json({ error: "Dish must have a price that is a positive number" });
  }

  res.locals.dishData = { name, description, price, image_url };
  next();
}

function validateDishId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id && id !== dishId) {
    return res.status(400).json({ error: `Dish id in the body (${id}) does not match dish id in the route (${dishId})` });
  }
  next();
}

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { name, description, price, image_url } = res.locals.dishData;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { name, description, price, image_url } = res.locals.dishData;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [validateDish, create],
  read: [dishExists, read],
  update: [dishExists, validateDishId, validateDish, update],
};
