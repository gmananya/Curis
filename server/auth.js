const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dateTime = require("node-datetime");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


const date = dateTime.create().format('y-m-d H:M:S');


// Login

exports.login = async (req, res) => {
    try {
        const {
            userid,
            password
        } = req.body;

        if (!userid || !password) {
            return res.status(400).render('login', {
                message: 'Please provide an userid and password'
            })
        }

        db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
            console.log(results);

            if (!results || !(await bcrypt.compare(password, results[0].user_password))) {
                res.status(401).render('login', {
                    message: 'ID or password is incorrect'
                })
            } else {

                const redir = results[0].user_role;
                if (redir == 'Donor') {
                    res.status(200).redirect("/donorStatus");
                } else if (redir == 'Doctor')
                    res.status(200).redirect("/doctorStatus");
                else if (redir == 'Hospital')
                    res.status(200).redirect("/hospitalStatus");
                else if (redir == 'Recipient')
                    res.status(200).redirect("/recipientStatus");
                else
                    res.status(200).redirect("/");
            }
        })
    } catch (error) {
        console.log(error);
    }
}


// Register
exports.register = (req, res) => {
    console.log(req.body);
    const {
        role,
        email,
        password,
        passwordConfirm
    } = req.body;
    db.query('SELECT user_email FROM Admin WHERE user_email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length > 0) {
            return res.render('register', {
                message: 'Account already exists'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }
        const id = crypto.randomBytes(16).toString("hex");
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO Admin SET ?', {
            user_role: role,
            user_email: email,
            user_password: hashedPassword,
            user_id: id
        }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('login', {
                    message: 'User registered ' + id
                });
            }
        })
    });
}


// Update Donor

exports.donor = (req, res) => {
    console.log(req.body);

    const {
        userid,
        name,
        address,
        phone,
        bloodgrp,
        age,
        hospital,
        medicalHistory,
        donateOrgan,
        gender,
        vitalStatus,
        fingerprint
    } = req.body;

    var file = req.files.fingerprint;
    var filename = file.name;
    console.log("Fingerprint file is - " + filename);

    const oid = crypto.randomBytes(16).toString("hex");

    db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;

        console.log(results);

        file.mv('public/images/fingerprints/' + file.name, function (err) {
            if (err)
                return res.status(500).send(err);

            db.query('INSERT INTO Donor SET ?', {
                id: id,
                name: name,
                address: address,
                phone: phone,
                bloodgrp: bloodgrp,
                age: age,
                hospital: hospital,
                medicalHistory: medicalHistory,
                donateOrgan: donateOrgan,
                gender: gender,
                vitalStatus: vitalStatus,
                dateOfDonation: date,
                organ_id: oid,
                fingerprint: filename,

            }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    res.render('donorStatus', {
                        message: 'Details updated'
                    });
                }
            })
        });
    });


    db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;
        db.query('SELECT * FROM Hospital WHERE name = ?', [hospital], (error, results) => {
            if (error) {
                console.log(error);
            }
            const hospital_id = results[0].id;
            db.query('SELECT * FROM Organ WHERE type = ?', [donateOrgan], (error, results) => {
                if (error) {
                    console.log(error);
                }
                const specialist = results[0].specialist;
                console.log(specialist)
                db.query('SELECT * FROM Doctor WHERE specialization = ? AND hospital = ? ', [specialist, hospital], (error, results) => {
                    if (error) {
                        console.log(error);
                    }
                    const doc_id = results[0].id;
                    const date = dateTime.create().format('y-m-d H:M:S');
                    db.query('INSERT INTO DonatedOrgan SET ?', {

                        id: oid,
                        donor_id: id,
                        bloodGroup: bloodgrp,
                        hospital_id: hospital_id,
                        date: date,
                        type: donateOrgan,
                        availability: 'Y',
                        doctor_id: doc_id

                    }, (error, results) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(results);
                            res.render('donorStatus', {
                                message: 'Details updated'
                            });
                        }
                    })
                })
            })
        })
    });
}



// Show Donor

exports.donorStatus = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;
        console.log(id);
        db.query('SELECT * FROM Donor WHERE id = ?', [id], (err, data, fields) => {
            if (err) throw err;
            else {
                return res.render('donorStatus', {
                    title: 'Details',
                    data: data
                });
            }

        });
    })
}


// Show Recipient

exports.recipientStatus = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT user_id FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;
        console.log(id);
        db.query('SELECT * FROM Recipient WHERE id = ?', [id], (err, data, fields) => {
            if (err) throw err;
            else {
                return res.render('recipientStatus', {
                    title: 'Details',
                    data: data
                });
            }

        });
    })
}


// Update Recipient

exports.recipient = (req, res) => {
    console.log(req.body);

    const {
        userid,
        name,
        address,
        phone,
        bloodgrp,
        age,
        medicalHistory,
        reqOrgan,
        gender,
        fingerprint
    } = req.body;

    var file = req.files.fingerprint;
    var filename = file.name;
    console.log("Fingerprint file is - " + filename);

    const date = dateTime.create().format('y-m-d H:M:S');

    file.mv('public/images/fingerprints/' + file.name, function (err) {
        if (err)
            return res.status(500).send(err);
        db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
            if (error) {
                console.log(error);
            }
            const id = results[0].user_id;

            db.query('INSERT INTO Recipient SET ?', {
                id: id,
                name: name,
                address: address,
                phone: phone,
                bloodgrp: bloodgrp,
                age: age,
                medicalHistory: medicalHistory,
                reqOrgan: reqOrgan,
                gender: gender,
                dateTimeOfRequest: date,
                fingerprint: filename
            }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    return res.render('recipientStatus', {
                        message: 'Details updated'

                    });
                }
            })

        });
    });
}

//Recipient Confirm

exports.recipientConfirm = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    const tid = crypto.randomBytes(16).toString("hex");

    db.query('SELECT * FROM Recipient WHERE id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const recName = results[0].name;
        const organ = results[0].reqOrgan;
        const bloodgrp = results[0].bloodgrp;
        const dtr = results[0].dateTimeOfRequest;

        db.query('SELECT * FROM Organ WHERE type = ?', [organ], async (error, results) => {
            if (error) {
                console.log(error);
            }
            const organCost = results[0].charges;
            const bool = 'Y'
            db.query('SELECT * FROM DonatedOrgan WHERE  type = ? AND bloodGroup = ? AND availability = ?  ', [organ, bloodgrp, bool], (err, results) => {
                const did = results[0].doctor_id;
                const oid = results[0].id;
                const hid = results[0].hospital_id;
                console.log(did);
                db.query('SELECT * FROM Doctor WHERE id=?', [did], (err, results) => {
                    const docName = results[0].name;
                    const hosName = results[0].hospital;
                    
                    console.log(results[0].hospital);
                    db.query('INSERT INTO Transplantation SET ?', {
                        recipient_id: userid,
                        organ_id: oid,
                        organType: organ,
                        dateTimeOfTransplant: null,
                        hospital_id: hid,
                        doctor_id: did,
                        transplantation_id: tid,
                        doctorConfirmation: null,
                        hospitalConfirmation: null,
                        timeOfRequest: dtr,
                        recipientName: recName,
                        hospitalName: hosName,
                        doctorName: docName,
                        treatmentCost: organCost,
                        radiology: 350,
                        laboratory: 7600,
                        surgicalSupplies: 2800,
                        pharmacy: 0.01 * organCost,
                        room: 3100,
                        totalCost: 350 + 7600 + organCost * 1.01 + 2800 +  + 3100,
                        finalCharges: 0.32 * (350 + 7600 + organCost * 1.01 + 2800 +  + 3100),
                    }, (error, results) => {
                        if (error) {
                            console.log(error);
                        }
                        console.log(results);
                    })
                })
                if (err) throw err;
                else {
                    return res.render('recipientConfirm', {
                        title: 'Details',
                        data: results
                    });
                }


            })


        })
    });
}

// Recipient Bill
exports.recipientBill = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT * FROM Transplantation WHERE recipient_id = ?', [userid], (err, results) => {

        const docConfirm = results[0].doctorConfirmation;
        if(docConfirm === 'Y'){
        if (err) throw err;
        else {
            return res.render('recipientBill', {
                title: 'Details',
                data: results
            });

        }}
        else{
            return res.render('recipientBill', {
                message: 'Your transplantation request is yet to be approved.',
            });
        }
    })

}
// Update Doctor

exports.doctor = (req, res) => {
    console.log(req.body);

    const {
        userid,
        name,
        address,
        phone,
        age,
        experience,
        specialization,
        qualification,
        gender,
        hospital,
        profileimg
    } = req.body;

    var file = req.files.profileimg;
    var filename = file.name;
    console.log("Profile image file is - " + filename);

    file.mv('public/images/profileimages/' + file.name, function (err) {
        if (err)
            return res.status(500).send(err);
        db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
            if (error) {
                console.log(error);
            }
            const id = results[0].user_id;

            db.query('INSERT INTO Doctor SET ?', {
                id: id,
                name: name,
                address: address,
                phone: phone,
                age: age,
                experience: experience,
                specialization: specialization,
                qualification: qualification,
                hospital: hospital,
                gender: gender,
                profileimg: filename
            }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    return res.render('doctorStatus', {
                        message: 'Details updated',

                    });
                }
            })
        });
    });
}


// Show Doctor

exports.doctorStatus = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT user_id FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;
        console.log(id);
        db.query('SELECT * FROM Doctor WHERE id = ?', [id], (err, data, fields) => {
            if (err) throw err;
            else {
                return res.render('doctorStatus', {
                    title: 'Details',
                    data: data
                });
            }

        });
    })
}


// Confirm Doctor
exports.doctorConfirm = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    const datetime = dateTime.create().format('y-m-d H:M:S');

    db.query('SELECT * FROM Transplantation WHERE doctor_id = ?', [userid], (err, results) => {

        const id = results[0].doctor_id;
        console.log(id);
        const oid = results[0].organ_id;

        console.log(id);
        db.query('UPDATE Transplantation  SET ? WHERE doctor_id = ?', [{
            doctorConfirmation: 'Y',
            dateTimeOfTransplant: datetime
        }, id], (error, results) => {
            if (error) {
                console.log(error);
            }
        })
        if (err) throw err;
        else {
            const docConfirm = results[0].doctorConfirmation;
            const hosConfirm = results[0].hospitalConfirmation;
            console.log("Operation in progress.");
            if (docConfirm === "Y" && hosConfirm === "Y") {
                console.log("Transplantation successful!");
                db.query('UPDATE DonatedOrgan SET availability = "N" WHERE id = ?', [oid], (err, result) => {
                    if (err) throw err;
                })
            }
            return res.render('doctorConfirm', {
                title: 'Details',
                data: results
            });
        }


    });

}




// Update Hospital

exports.hospital = (req, res) => {
    console.log(req.body);

    const {
        userid,
        name,
        address,
        phone,
        licenseNumber
    } = req.body;

    console.log(userid)
    db.query('SELECT * FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }

        console.log(userid)
        const id = results[0].user_id;

        db.query('INSERT INTO Hospital SET ?', {
            id: id,
            name: name,
            address: address,
            phone: phone,
            licenseNumber: licenseNumber
        }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('hospitalStatus', {
                    message: 'Details updated'
                });
            }
        })
    });
}

// Show Hospital

exports.hospitalStatus = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT user_id FROM Admin WHERE user_id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }
        const id = results[0].user_id;
        console.log(id);
        db.query('SELECT * FROM Hospital WHERE id = ?', [id], (err, data, fields) => {
            if (err) throw err;
            else {
                return res.render('hospitalStatus', {
                    title: 'Details',
                    data: data
                });
            }

        });
    })
}

// Confirm Hospital

exports.hospitalConfirm = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT * FROM Transplantation WHERE hospital_id = ?', [userid], (err, results) => {

        const id = results[0].hospital_id;
        const oid = results[0].organ_id;

        console.log(id);
        db.query('UPDATE Transplantation SET ? WHERE hospital_id = ? AND organ_id = ?', [{
            hospitalConfirmation: 'Y',
        }, id, oid], (err, results) => {
            if (err) throw err;
        });
        if (err) throw err;
        else {
            return res.render('hospitalConfirm', {
                title: 'Details',
                data: results
            });

        }
    })
}

// Hospital Transplant Report

exports.hospitalTransplantReport = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT * FROM Transplantation WHERE hospital_id = ?', [userid], (err, results) => {
        const docConfirm = results[0].doctorConfirmation;
        if(docConfirm === 'Y'){
        if (err) throw err;
        else {
            return res.render('hospitalTransplantReport', {
                title: 'Details',
                data: results
            });

        }}
        else{
            return res.render('hospitalTransplantReport', {
            });
        }
    })
}

// Hospital Report

exports.hospitalReport = (req, res) => {
    console.log(req.body);

    const {
        userid
    } = req.body;

    db.query('SELECT name FROM Hospital WHERE id = ?', [userid], async (error, results) => {
        if (error) {
            console.log(error);
        }

        const hname = results[0].name;
        db.query('SELECT * FROM Doctor WHERE hospital = ?', [hname], (err, data, fields) => {
            if (err) throw err;
            else {
                return res.render('hospitalReport', {
                    title: 'Details',
                    data: data
                });
            }
        });
    });
}