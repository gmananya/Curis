const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render('landing');
});

router.get('/landing', (req, res) => {
    res.render('landing');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

// Recipient
router.get('/recipient', (req, res) => {
    res.render('recipient');
});

router.get('/recipientStatus', (req, res) => {
    res.render('recipientStatus');
});

router.get('/recipientConfirm', (req, res) => {
    res.render('recipientConfirm');
});
router.get('/recipientBill', (req, res) => {
    res.render('recipientBill');
});
// Hospital
router.get('/hospital', (req, res) => {
    res.render('hospital');
});

router.get('/hospitalStatus', (req, res) => {
    res.render('hospitalStatus');
});

router.get('/hospitalConfirm', (req, res) => {
    res.render('hospitalConfirm');
});

router.get('/hospitalTransplantReport', (req, res) => {
    res.render('hospitalTransplantReport');
});

router.get('/hospitalReport', (req, res) => {
    res.render('hospitalReport');
});

// Donor
router.get('/donor', (req, res) => {
    res.render('donor');
});

router.get('/donorStatus', (req, res) => {
    res.render('donorStatus');
});

// Doctor
router.get('/doctor', (req, res) => {
    res.render('doctor');
});

router.get('/doctorStatus', (req, res) => {
    res.render('doctorStatus');
});

router.get('/doctorConfirm', (req, res) => {
    res.render('doctorConfirm');
});


module.exports = router;