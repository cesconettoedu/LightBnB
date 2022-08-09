const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg'); // 1- require 

// 2- code to connect database
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// 3-test connect
// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

// 5-reactoring function
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * FROM users WHERE users.email = $1;`, [email])
  .then((result) => {
    
      if(result.rows) {        
        return result.rows[0];
      } else {
        return null;
      }
    })
  .catch (err => {
    console.log('query error:', err)
  });
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

// 6-reactoring function
const getUserWithId = function(id) {
  return pool.query(`
  SELECT * FROM users WHERE users.id = $1;`, [id])
  .then((result) => {

    if(result.rows) {
      return result.rows[0];
    } else {
      return null
    }
  })
  .catch (err => {
    console.log('query error:', err);
  });
  
}

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */


// 7-refactoring function
const addUser =  function(user) {
  return pool.query(`
  INSERT INTO users (name, email, password) VALUES ($1, $2, $3);`, [user.name, user.email, user.password])
  .then((result) => {

    if(result.rows) {
      return result.rows[0];
    } else {
      return null
    }
  })
  .catch (err => {
    console.log('query error:', err);
  });
  
}

exports.addUser = addUser;





/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  //return getAllProperties(null, 2);
return pool.query(`
  SELECT reservations.id, title, cost_per_night, reservations.start_date, avg(rating) as average_rating, thumbnail_photo_url, parking_spaces, number_of_bathrooms, number_of_bedrooms
  FROM properties
  JOIN reservations ON property_id = properties.id
  JOIN property_reviews ON reservation_id = reservations.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, title, reservations.start_date, cost_per_night, thumbnail_photo_url, parking_spaces, number_of_bathrooms, number_of_bedrooms
  ORDER BY start_date 
  LIMIT 10;`, [guest_id])
  .then((result) => {

    if(result.rows) {
      return result.rows;
    } else {
      return null
    }
  })
  .catch (err => {
    console.log('query error:', err);
  });

}
exports.getAllReservations = getAllReservations;







/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

// 4- update the function
const getAllProperties = (options, limit = 10) => {
  
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      //console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;



