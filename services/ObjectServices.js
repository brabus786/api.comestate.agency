const axios = require('axios');
const convert = require('xml-js');
const ObjectModel = require('../models/Object');


const getAllObject = async () => {
    const allObject = await ObjectModel.find();
    return allObject;
}


const getTotalCount = async () => {
    const TotalCount = await ObjectModel.countDocuments();
    // console.log(TotalCount + ' moy ');
    return TotalCount;
}


const getObjectsFromCRM = () => {
    return axios.get('https://crm-alice-kharkiv.realtsoft.net/feed/xml?id=5')
        .then(function (response) {
            const result = convert.xml2json(response.data, { compact: true, spaces: 4 });
            return result;
        })
        .catch(function (error) {
            console.log(error);
        });
};

const clearObjects = async () => await ObjectModel.deleteMany();

const uploadObjectsToDB = async (crmObjectsJson) => {
    // const realties = JSON.parse(crmObjectsJson).realties.realty;
    const realties = JSON.parse(crmObjectsJson).response.item;

    const views = await ObjectModel.find({}, 'views local_realty_id');
    console.log(views);

    await clearObjects();

    const arrObj = [];
    for (let i = 0; i < realties.length; i++) {

        let properties = realties[i].properties.property ? realties[i].properties.property : [];

        // console.log(properties);

        let metroStation = '';
        let distanceToMetro = '';
        let tenants = '';
        let rentalYield = '';

        for (let y = 0; y < properties.length; y++) {
            let attribute = properties[y]._attributes.attribute;
            if (attribute == 'property_51') metroStation = properties[y]._text;
            if (attribute == 'property_52') distanceToMetro = parseInt(properties[y]._text.match(/\d+/));
            if (attribute == 'property_53') tenants = properties[y]._text;
            if (attribute == 'property_54') rentalYield = properties[y]._text;
        }

        //console.log(distanceToMetro);


        const arr = realties[i].images.image_url;
        const arrIMG = [];
        if (arr != undefined) {
            for (s = 0; s < arr.length; s++) {
                const linkIMG = arr[s]._text;
                //console.log(arr[s]._text);
                arrIMG.push(linkIMG);
            }
        }

        // console.log(realties[i]);

        const price = realties[i].price ? parseInt(realties[i].price._text) : null;
        const area = realties[i].area_total ? parseInt(realties[i].area_total._text) : null;

        const obj = {
            map_lat: realties[i].location.map_lat !== undefined ? realties[i].location.map_lat._text : null,
            map_lng: realties[i].location.map_lng !== undefined ? realties[i].location.map_lng._text : null,
            local_realty_id: realties[i]._attributes['internal-id'],
            realty_type: realties[i].realty_type._text,
            advert_type: realties[i].deal._text,
            state: realties[i].location.region._text,
            city: realties[i].location.city._text,
            district: realties[i].location.district != undefined ? realties[i].location.district._text : null,
            street: realties[i].location.street._text,
            longitude: realties[i].location.map_lng != undefined ? realties[i].location.map_lng._text : null,
            latitude: realties[i].location.map_lat != undefined ? realties[i].location.map_lat._text : null,
            title: realties[i].title._text,
            description: realties[i].description._text,
            photos_urls: arrIMG,
            metro_station: metroStation, //название метро
            distance_to_metro: distanceToMetro, //расстояние до метро
            tenants: tenants, // есть арендаторы
            rental_yield: rentalYield, // рентабельность
            created_at: realties[i].created_at._text,
            wall_type: null,
            rooms_count: null,
            total_area: area,
            floor: realties[i].floor ? parseInt(realties[i].floor._text) : null,
            floors: realties[i].total_floors ? parseInt(realties[i].total_floors._text) : null,
            price: price,
            price_type: null,
            currency: realties[i].price._attributes.currency,
            pricePerSqure: Math.round(price / area),
            views: views.find(v => v.local_realty_id == realties[i]._attributes['internal-id'])?.views
        }


        arrObj.push(obj);


    }

    // console.log(arrObj);

    await ObjectModel.insertMany(arrObj, function (error, docs) {
        console.log(error);
    });

}



const listObjects = async (filterOptions, pageIndex, perPage) => {
    // console.log(filterOptions);
    const filterMap = {
        advertType: 'advert_type',
        property_pype: 'realty_type',
        objectId: 'local_realty_id'
    }
    console.log(filterOptions);
    const findObject = {};
    for (let key in filterOptions) {
        const dbKeyName = filterMap[key]
        if (dbKeyName && filterOptions[key] !== 'default') {
            findObject[dbKeyName] = filterOptions[key];
        }

        switch (key) {
            case 'district':
                findObject.district = { $in: filterOptions.district }
                break;
            case 'subway':
                console.log(filterOptions.subway);
                findObject.metro_station = { $in: filterOptions.subway }
                break;
            case 'subwayDistance':
                console.log(parseInt(filterOptions.subwayDistance));
                findObject.distance_to_metro = { $lte: parseInt(filterOptions.subwayDistance) };
                break;
            case 'tenants':
                findObject.tenants = 'Да';
                break;
            case 'priceObjectTo':
                findObject.price = { ...findObject.price, $lt: filterOptions[key] }
                break;

            case 'priceObjectFrom':
                findObject.price = { ...findObject.price, $gt: filterOptions[key] }
                break;

            case 'tenants':
                findObject.price = { ...findObject.price, $gt: filterOptions[key] }
                break;

            case 'priceSqureTo':
                findObject.pricePerSqure = { ...findObject.pricePerSqure, $lt: filterOptions[key] }
                break;

            case 'priceSqureFrom':
                findObject.pricePerSqure = { ...findObject.pricePerSqure, $gt: filterOptions[key] }
                break;

            case 'squreFrom':
                findObject.total_area = { ...findObject.total_area, $gt: filterOptions[key] }
                break;

            case 'squareTo':
                findObject.total_area = { ...findObject.total_area, $lt: filterOptions[key] }
                break;
        }
    }


    const sort = filterOptions.sort ? filterOptions.sort : 'local_realty_id';



    const objects = await ObjectModel.find(findObject)
        .skip(perPage * (pageIndex - 1))
        .limit(perPage)
        .sort(sort)
        .exec();

    //console.log('Filtring Object', findObject);

    const objectsCount = await ObjectModel.count(findObject);

    //console.log(objectsCount);

    return {
        meta: {
            totalCount: objectsCount,
            pageCount: Math.ceil(objectsCount / perPage),
            currentPage: pageIndex,
            perPage
        },
        result: objects
    };
}

const listOneObject = async (id) => {
    const object = await ObjectModel.findOne({ local_realty_id: id });
    return object;
};

const listSimilarbject = async (price) => {
    const similarObjectsLowerPrice = await ObjectModel.find({ price: { $lt: price } }, null, {
        sort: { price: -1 },
        limit: 2,
    });
    const similarObjectsGreaterPrice = await ObjectModel.find({ price: { $gt: price } }, null, {
        sort: { price: 1 },
        limit: 2,
    });
    const similar = similarObjectsLowerPrice.concat(similarObjectsGreaterPrice);
    return similar;
}

const resaltFilterInfo = async () => {

    const district = await ObjectModel.distinct('district').exec();
    const realty_type = await ObjectModel.distinct('realty_type').exec();
    const city = await ObjectModel.distinct('city').exec();
    const advert_type = await ObjectModel.distinct('advert_type').exec();
    const wall_type = await ObjectModel.distinct('wall_type').exec();
    const metro_station = await ObjectModel.distinct('metro_station').exec();
    const distance_to_metro = await ObjectModel.distinct('distance_to_metro').exec();
    const tenants = await ObjectModel.distinct('tenants').exec();
    const rental_yield = await ObjectModel.distinct('rental_yield').exec();


    const resalt = {
        district: district,
        realty_type: realty_type,
        city: city,
        advert_type: advert_type,
        wall_type: wall_type,
        metro_station: metro_station,
        distance_to_metro: distance_to_metro,
        tenants: tenants,
        rental_yield: rental_yield,
    };
    return resalt;
}


const addView = async (id) => {
    const views = await ObjectModel.findOne({ local_realty_id: id });
    const viewsCalc = views.views == undefined ? 0 + 1 : views.views + 1;
    await ObjectModel.updateOne({ local_realty_id: id }, { views: viewsCalc });
    //console.log(viewsCalc);
}



const getXml = async () => {
    const allId = await ObjectModel.find(null, 'local_realty_id created_at');

    let xml = '';
    for (let i = 0; i < allId.length; i++) {
        let create = allId[i].created_at.split('T')
        xml += `
                <url>
                    <loc>https://comestate.agency/object?id=${allId[i].local_realty_id}</loc>
                    <lastmod>${create[0]}</lastmod>
                </url>
               `
    }

    return (`
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                ${xml}
            </urlset>    
    `)
}


module.exports = {
    resaltFilterInfo,
    uploadObjectsToDB,
    getObjectsFromCRM,
    listObjects,
    listOneObject,
    listSimilarbject,
    addView,
    clearObjects,
    getXml,
    getTotalCount,
    getAllObject,
};
