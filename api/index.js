const express = require('express');
const router = express.Router();
const objectServices = require('../services/ObjectServices');

router.get('/filterInfo', async function (req, res) {
    const resaltFilterInfo = await objectServices.resaltFilterInfo();
    //console.log(resaltFilterInfo);
    res.send(resaltFilterInfo);
})

router.get('/getCrm', async function (req, res) {
    console.log('start')
    const result = await objectServices.getObjectsFromCRM();
    objectServices.clearObjects();
    objectServices.uploadObjectsToDB(result);
    res.send(result);
    console.log('finish')

})


router.post('/test', async function (req, res) {
    const filterOptions = req.body;
    const page = req.query.page;
    const perPage = 48;
    const objects = await objectServices.listObjects(filterOptions, page, perPage);

    //console.log(objects);

    res.send(objects);
});


router.get('/object', async function (req, res) {
    objectServices.addView(req.query.id);
    const object = await objectServices.listOneObject(req.query.id);
    res.send(object);
});

router.get('/similar', async function (req, res) {
    const object = await objectServices.listSimilarbject(req.query.price)
    //console.log(object.length)
    res.send(object);
});

router.get('/sitemap', async function (req, res) {
    let xml = await objectServices.getXml();
    res.set('Content-Type', 'text/xml');
    res.send(xml);
})

router.get('/totalcount', async function (req, res) {
    const getTotalCount = await objectServices.getTotalCount();
    //console.log(getTotalCount);
    res.send(getTotalCount);
})

router.get('/getAllObject', async function (req, res) {
   const getAllObject = await objectServices.getAllObject();
    res.send(getAllObject);
})

module.exports = router;


