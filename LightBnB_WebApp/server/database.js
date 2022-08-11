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


///*********************** USERS *********************************
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

//function for when a existing user trying to login
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * FROM users WHERE users.email = $1;`, [email])
    .then((result) => {
    
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log('query error:', err);
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

// keep the user logged
const getUserWithId = function(id) {
  return pool.query(`
  SELECT * FROM users WHERE users.id = $1;`, [id])
    .then((result) => {

      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log('query error:', err);
    });

};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// to add a new user
const addUser =  function(user) {
  return pool.query(`
  INSERT INTO users (name, email, password) VALUES ($1, $2, $3);`, [user.name, user.email, user.password])
    .then((result) => {

      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log('query error:', err);
    });
  
};

exports.addUser = addUser;

///********************* RESERVATIONS ********************************
/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

// show the current user's reservations
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`
  SELECT reservations.id, title, cost_per_night, reservations.start_date, avg(rating) as average_rating, thumbnail_photo_url, parking_spaces, number_of_bathrooms, number_of_bedrooms
  FROM properties
  JOIN reservations ON property_id = properties.id
  JOIN property_reviews ON reservation_id = reservations.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, title, reservations.start_date, cost_per_night, thumbnail_photo_url, parking_spaces, number_of_bathrooms, number_of_bedrooms
  ORDER BY start_date 
  LIMIT $2;`, [guest_id, limit])
    .then((result) => {

      if (result.rows) {
        return result.rows;
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log('query error:', err);
    });

};
exports.getAllReservations = getAllReservations;

///********************* PROPERTIES ********************************
/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

// return the search with parameters provided by the user
const getAllProperties = (options, limit = 10) => {
  
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT OUTER JOIN property_reviews ON properties.id = property_id
  `;
 
  // if owner_id passed
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length} `;
  }

  
  if (options.city) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += ` AND `;
    }
    queryParams.push(`${options.city}`);
    queryString += `city LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += ` AND `;
    }
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `cost_per_night > $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += ` AND `;
    }
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `cost_per_night < $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += ` AND `;
    }
    queryParams.push(`${options.minimum_rating}`);
    queryString += `property_reviews.rating >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool
    .query(queryString, queryParams).then((result) => {
      if (result.rows) {
        return result.rows;
      } else {
        return null;
      }
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

//function to save a new property to the properties table
const addProperty = function(property) {
  return pool.query(`
  INSERT INTO properties 
    (owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`,
  [property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms])
    .then((result) => {

      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log('query error:', err);
    });

};
exports.addProperty = addProperty;
