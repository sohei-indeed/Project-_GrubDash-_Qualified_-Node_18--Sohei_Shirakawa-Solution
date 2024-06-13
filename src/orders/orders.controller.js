const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function validateOrderForCreate(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return res.status(400).json({ error: "Order must include a deliverTo" });
  }
  if (!mobileNumber || mobileNumber === "") {
    return res.status(400).json({ error: "Order must include a mobileNumber" });
  }
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return res.status(400).json({ error: "Order must include at least one dish" });
  }
  dishes.forEach((dish, index) => {
    if (!dish.quantity || typeof dish.quantity !== "number" || dish.quantity <= 0) {
      return res.status(400).json({ error: `Dish ${index} must have a quantity that is an integer greater than 0` });
    }
  });

  res.locals.orderData = { deliverTo, mobileNumber, dishes };
  next();
}

function validateOrderForUpdate(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return res.status(400).json({ error: "Order must include a deliverTo" });
  }
  if (!mobileNumber || mobileNumber === "") {
    return res.status(400).json({ error: "Order must include a mobileNumber" });
  }
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return res.status(400).json({ error: "Order must include at least one dish" });
  }
  dishes.forEach((dish, index) => {
    if (!dish.quantity || typeof dish.quantity !== "number" || dish.quantity <= 0) {
      return res.status(400).json({ error: `Dish ${index} must have a quantity that is an integer greater than 0` });
    }
  });

  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || status === "" || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Order must include a valid status" });
  }

  res.locals.orderData = { deliverTo, mobileNumber, status, dishes };
  next();
}

function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id && id !== orderId) {
    return res.status(400).json({ error: `Order id in the body (${id}) does not match order id in the route (${orderId})` });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { deliverTo, mobileNumber, dishes } = res.locals.orderData;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { deliverTo, mobileNumber, status, dishes } = res.locals.orderData;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const order = res.locals.order;

  if (order.status !== "pending") {
    return res.status(400).json({ error: "An order cannot be deleted unless it is pending" });
  }

  const index = orders.findIndex(order => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateOrderForCreate, create],
  read: [orderExists, read],
  update: [orderExists, validateOrderId, validateOrderForUpdate, update],
  delete: [orderExists, destroy],
};
