const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const objectShema = new Schema({
    map_lat:Number,
    map_lng:Number,
    local_realty_id: Number,
    created_at:Number,
    realty_type: String,
    advert_type: String,
    state: String,
    city: String,
    district: String,
    street: String,
    longitude: Number,
    latitude: Number,
    title: String,
    description: String,
    photos_urls: Array,
    metro_station: String, //название метро
    distance_to_metro:Number, //расстояние до метро
    tenants:String, // есть арендаторы
    rental_yield:String, // рентабельность
    created_at: String,
    wall_type: String,
    rooms_count: Number,
    total_area: Number,
    floor: Number,
    floors:Number,
    price: Number,
    price_type: String,
    currency: String,
    views:Number,
    pricePerSqure: Number,
});


const Object = mongoose.model("Objects", objectShema);

module.exports = Object;