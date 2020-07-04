const express = require("express");
const bodyParser = require("body-parser");
const Dishes = require("../models/dishes");
const Favorites = require("../models/favorites");
const User = require("../models/user");
const authenticate = require("../authenticate");
const e = require("express");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .get(authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      });
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }
        if (!req.body.dishes) {
          err = new Error("Please provide a list of dishes in the body");
          err.status = 400;
          return next(err);
        } else if (
          JSON.stringify(req.body.dishes) === JSON.stringify(favorite.dishes)
        ) {
          err = new Error("This array already exist in your favorites");
          err.status = 403;
          return next(err);
        } else {
          Favorites.findByIdAndUpdate(favorite._id, {
            $set: { dishes: req.body.dishes },
          })
            .populate("user")
            .populate("dishes")
            .exec((err, favorite) => {
              if (err) {
                err.status = 400;
                return next(err);
              } else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json({
                  message: "Successfully added all dishes!",
                  favorite,
                });
              }
            });
        }
      });
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user }).exec((err, favorite) => {
      if (err) {
        err.status = 400;
        return next(err);
      } else {
        favorite.remove();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({ message: "Successfully deleted all dishes!", favorite });
      }
    });
  });

favoriteRouter
  .route("/:dishId")
  //   .get((req,res,next) => {
  //       Dishes.findById(req.params.dishId)
  //       .populate('comments.author')
  //       .then((dish) => {
  //           res.statusCode = 200;
  //           res.setHeader('Content-Type', 'application/json');
  //           res.json(dish);
  //       }, (err) => next(err))
  //       .catch((err) => next(err));
  //   })
  .post(authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }
        if (!req.params.dish) {
          err = new Error("Please provide a dish in the params");
          err.status = 400;
          return next(err);
        } else {
          Dishes.findById(req.params.dishId).exec((err, dish) => {
            if (err) {
              err = new Error("Dish not found");
              err.status = 404;
              return next(err);
            }
            favorite.dishes.map((favdish) => {
              if (favdish === dish) {
                err = new Error("Dish already exists in your favorites");
                err.status = 400;
                return next(err);
              }
            });
            favorite.dish.push(dish);
            favorite.save();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              message: "Successfully added the dish!",
              favorite,
            });
          });
        }
      });
  });

//   .put(authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
//     Dishes.findByIdAndUpdate(
//       req.params.dishId,
//       {
//         $set: req.body,
//       },
//       { new: true }
//     )
//       .then(
//         (dish) => {
//           res.statusCode = 200;
//           res.setHeader("Content-Type", "application/json");
//           res.json(dish);
//         },
//         (err) => next(err)
//       )
//       .catch((err) => next(err));
//   })
//   .delete(authenticate.verifyUser,(req, res,next) => {
//     Dishes.findByIdAndRemove(req.params.dishId)
//       .then((resp) => {
//         res.statusCode = 200;
//         res.setHeader("Content-type", "application/json");
//         res.json(resp);
//       }, (err) => next(err))
//       .catch((err) => next(err));
//   });

module.exports = favoriteRouter;
