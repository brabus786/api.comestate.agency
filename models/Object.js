const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const objectShema = new Schema({
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