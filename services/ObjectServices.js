const axios = require('axios');
const convert = require('xml-js');
const ObjectModel = require('../models/Object');

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
    //const realties = JSON.parse(crmObjectsJson).realties.realty;
    const realties = JSON.parse(crmObjectsJson).response.item;

    const arrObj = [];
    for (let i = 0; i < realties.length; i++) {

       //console.log(realties[i].price._attributes.currency);

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

        const price = realties[i].price? parseInt(realties[i].price._text) : null;
        const area = realties[i].area_total? parseInt(realties[i].area_total._text) : null;

        const obj = {
             local_realty_id:realties[i]._attributes['internal-id'],
             realty_type: realties[i].realty_type._text,
             advert_type: realties[i].deal._text,
             state: realties[i].location.region._text,
             city: realties[i].location.city._text,
             district: realties[i].location.district._text,
             street: realties[i].location.street._text,
             longitude: realties[i].location.map_lng != undefined? realties[i].location.map_lng._text: null,
             latitude: realties[i].location.map_lat != undefined? realties[i].location.map_lat._text: null,
             title: realties[i].title._text,
             description: realties[i].description._text,
             photos_urls: arrIMG,
             wall_type: null,
             rooms_count: null,
             total_area: area,
             floor: realties[i].floor ? parseInt(realties[i].floor._text) : null,
             floors: realties[i].total_floors ? parseInt(realties[i].total_floors._text) : null,
             price: price,
             price_type: null,
             currency: realties[i].price._attributes.currency,
             pricePerSqure: Math.round(price / area)
        }


        arrObj.push(obj);


    }

    //console.log(arrObj);

    await ObjectModel.insertMany(arrObj, function (error, docs) {
        console.log(error);
    });

}


const listObjects = async (filterOptions, pageIndex, perPage) => {
    console.log(filterOptions);
    const filterMap = {
        advertType: 'advert_type',
        district: 'district',
        property_pype: 'realty_type',
    }

    const findObject = {};
    for (let key in filterOptions) {
        const dbKeyName = filterMap[key]
        if (dbKeyName && filterOptions[key] !== 'default') {
            findObject[dbKeyName] = filterOptions[key];
        }

        switch (key) {
            case 'priceObjectTo':
                findObject.price = { ...findObject.price, $lt: filterOptions[key] }
                break;

            case 'priceObjectFrom':
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
    
    console.log(findObject);

    const objectsCount = await ObjectModel.count(findObject);

    console.log(objectsCount);

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

    const resalt = {
        district: district,
        realty_type: realty_type,
        city: city,
        advert_type: advert_type,
        wall_type: wall_type,
    };
    return resalt;
}


const addView = async (id) => {
    const views = await ObjectModel.findOne({ local_realty_id: id });
    const viewsCalc = views.views == undefined ? 0 + 1 : views.views + 1;
    await ObjectModel.updateOne({ local_realty_id: id }, { views: viewsCalc });
    console.log(viewsCalc);
}


module.exports = {
    resaltFilterInfo,
    uploadObjectsToDB,
    getObjectsFromCRM,
    listObjects,
    listOneObject,
    listSimilarbject,
    addView,
    clearObjects
};
