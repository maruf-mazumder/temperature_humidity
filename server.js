const express = require('express');
const app = express();
app.set('view engine', 'ejs');
const mysql = require('mysql');

const http = require('http');
const socketIO = require('socket.io');


const server = http.createServer(app);
const io = socketIO(server);

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sensordata'
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database!');
    connection.query("SELECT humidity FROM humidity_temperature WHERE(humidity IS NOT NULL) ORDER BY id DESC LIMIT 5" , function(error , humidity){
      
      if(error) throw error;
      console.log(humidity);
      
      connection.query("SELECT temperature FROM humidity_temperature WHERE(temperature IS NOT NULL) ORDER BY id DESC LIMIT 5" ,function(error , temperature){
       
        if(error) throw error;
        console.log(temperature);
        app.get('/', (req, res) => {

          const chartData = {
            labels: ['1st', '2nd', '3rd', '4th', '5th'],
            datasets: [{
              label: 'Humidity',
              data: humidity.map(obj => obj.humidity),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
     }]
          };


          const temperatureData = {
            labels: ['1st', '2nd', '3rd', '4th', '5th'],
            datasets: [{
              label: 'temperature',
              data: temperature.map(temp => temp.temperature),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)' ,
              borderWidth: 1
            }]
          };

          res.render('index.ejs', {title : "Temperature - Humidity", holdResult: humidity.concat(temperature) , chartData , temperatureData });
        });



        // io.on('connection', (socket) => {
        //   console.log('Client connected');
        
        //   // Example: Sending updated data every second
        //   setInterval(() => {
        //     const sqlForHumidity = 'SELECT humidity FROM humidity_temperature WHERE(humidity IS NOT NULL) ORDER BY id DESC LIMIT 5;';
        //     const sqlForTemperature = 'SELECT temperature FROM humidity_temperature WHERE(temperature IS NOT NULL) ORDER BY id DESC LIMIT 5';
        //     connection.query(sqlForHumidity, (err, humidity) => {
        //       if (err) throw err;
        //       connection.query(sqlForTemperature, (err, temperature) =>{


        //         const chartData = {
        //           labels: ['1st', '2nd', '3rd', '4th', '5th'],
        //           datasets: [{
        //             label: 'Humidity',
        //             data: humidity.map(obj => obj.humidity),
        //             backgroundColor: 'rgba(75, 192, 192, 0.2)',
        //             borderColor: 'rgba(75, 192, 192, 1)',
        //             borderWidth: 1
        //    }]
        //         };
      
      
        //         const temperatureData = {
        //           labels: ['1st', '2nd', '3rd', '4th', '5th'],
        //           datasets: [{
        //             label: 'temperature',
        //             data: temperature.map(temp => temp.temperature),
        //             backgroundColor: 'rgba(75, 192, 192, 0.2)',
        //             borderColor: 'rgba(75, 192, 192, 1)' ,
        //             borderWidth: 1
        //           }]
        //         };

        //       socket.emit('dataUpdate', { holdResult: humidity.concat(temperature) , chartData , temperatureData });
        //       })
              
        //     });
        //   }, 1000);
        // });


        app.listen(3000, () => {
          console.log('Server listening on port 3000');
        });
      })

    });

 
  });


    io.on('connection', (socket) => {
          console.log('Client connected');
        
          // Example: Sending updated data every second
          setInterval(() => {
            const sqlForHumidity = 'SELECT humidity FROM humidity_temperature WHERE(humidity IS NOT NULL) ORDER BY id DESC LIMIT 5;';
            const sqlForTemperature = 'SELECT temperature FROM humidity_temperature WHERE(temperature IS NOT NULL) ORDER BY id DESC LIMIT 5';
            connection.query(sqlForHumidity, (err, humidity) => {
              if (err) throw err;
              connection.query(sqlForTemperature, (err, temperature) =>{


                const chartData = {
                  labels: ['1st', '2nd', '3rd', '4th', '5th'],
                  datasets: [{
                    label: 'Humidity',
                    data: humidity.map(obj => obj.humidity),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
           }]
                };
      
      
                const temperatureData = {
                  labels: ['1st', '2nd', '3rd', '4th', '5th'],
                  datasets: [{
                    label: 'temperature',
                    data: temperature.map(temp => temp.temperature),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)' ,
                    borderWidth: 1
                  }]
                };

              socket.emit('dataUpdate', { holdResult: humidity.concat(temperature) , chartData , temperatureData });
              })
              
            });
          }, 1000);
        });


// app.get('/', async (req, res) => {

//     let holdResult = [];
//     function setHoldResult(data){   
//         holdResult = data;
//         console.log("qqqq" , holdResult);
//         res.render('index', { title: 'Humidity Temperature' , holdResult});
//     }
//     holdResult = await connection.query("SELECT * FROM humidity_temperature" , function(error , result){
//         if(error) throw error;
//         console.log(result);
//         setHoldResult(result);
//     });

// });

// app.listen(3000, () => {
//   console.log('Server listening on port 3000');
// });



const mqtt = require('mqtt');
// const MongoClient = require('mongodb').MongoClient;

const client = mqtt.connect('mqtt://test.mosquitto.org', {
  port: 1883
});

// const xx = process.env.MY_VARIABLE
// client.subscribe(`${xx}`);

// client.publish('my/topic', 'Hello, MQTT!');


client.on('connect', function() {
  console.log('MQTT client connected');
});

const topics = ["humidity" , "temperature"];
client.subscribe(topics);

client.on('message', function(topic, message) {
  console.log('Message received on topic ' + topic + ': ' + message.toString());

//   connection.query("SELECT * FROM humidity_temperature" , function(error , result){
//     if(error) throw error;
//     console.log(result);
// });

if(topic.includes("humidity")){
    client.subscribe(`humidity`);
    connection.query("INSERT INTO humidity_temperature SET ?", {humidity: parseInt(message) , temperature : null ,  date: new Date()
    } ,
   function(error , result){
    if(error) throw error;
    console.log(result);
    });
}
if(topic.includes("temperature")){
    
    connection.query("INSERT INTO humidity_temperature SET ?", {humidity: null , temperature : parseInt(message) ,  date: new Date()
    } ,
   function(error , result){
    if(error) throw error;
    console.log(result);
    }); 
}

 
});

client.on('error', function(err) {
  console.error('MQTT error:', err);
});






