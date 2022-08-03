SELECT reservations.id, title, cost_per_night, reservations.start_date, avg(rating) as average_rating
FROM properties
JOIN reservations ON property_id = properties.id
JOIN property_reviews ON reservation_id = reservations.id
WHERE reservations.guest_id = 1
GROUP BY reservations.id, title, reservations.start_date, cost_per_night
ORDER BY start_date 
LIMIT 10
;