import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

//Import Firebase
import firebase from 'firebase';

//Import StorageDataTable
import StorageDataTable from './Components/StorageDataTable';

//Import npm bulma
import 'bulma/css/bulma.css'

//Import npm react-filepond
import { FilePond, File, registerPlugin } from 'react-filepond';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// FilePond Register plugin
import FilePondImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
registerPlugin(FilePondImagePreview);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      files: [], //ใช้เก็บข้อมูล File ที่ Upload
      uploadValue: 0, //ใช้เพื่อดู Process การ Upload
      filesMetadata: [], //ใช้เพื่อรับข้อมูล Metadata จาก Firebase
      rows: [], //ใช้วาด DataTable
    };

    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyA57DUcNR8v9ru5z-hHQgQbVLJmDBAF-G4",
      authDomain: "test-project-ling.firebaseapp.com",
      databaseURL: "https://test-project-ling.firebaseio.com",
      projectId: "test-project-ling",
      storageBucket: "test-project-ling.appspot.com",
      messagingSenderId: "989521686632"
    };
    firebase.initializeApp(config);


  }
  //ใช้ตอนที่ยังไม่ Mount DOM
  componentWillMount() {
    this.getMetaDataFromDatabase()
  }

  //โหลดข้อมูล Metadata จาก Firebase
  getMetaDataFromDatabase() {
    console.log("getMetaDataFromDatabase");
    const databaseRef = firebase.database().ref('/filepond');

    databaseRef.on('value', snapshot => {
      this.setState({
        filesMetadata: snapshot.val()
      }, () => {
        this.addMetadataToList()
      });
    });
  }

  //ลบข้อมูล Metada จาก Firebase
  deleteMetaDataFromDatabase(e, rowData) {

    const storageRef = firebase.storage().ref(`filepond/${rowData.name}`);

    // Delete the file on storage
    storageRef.delete()
      .then(() => {
        console.log("Delete file success");

        let databaseRef = firebase.database().ref('/filepond');

        // Delete the file on realtime database
        databaseRef.child(rowData.key).remove()
          .then(() => {
            console.log("Delete metada success");
            this.getMetaDataFromDatabase()
          })
          .catch((error) => {
            console.log("Delete metada error : ", error.message);
          });

      })

      .catch((error) => {
        console.log("Delete file error : ", error.message);
      });


  }

  //โหลดข้อมูลเข้า list table
  addMetadataToList() {
    let i = 1;
    let rows = [];

    //Loop add data to rows
    for (let key in this.state.filesMetadata) {

      let fileData = this.state.filesMetadata[key];

      let objRows = {
        no: i++,
        key: key, //ใช้เพื่อ Delete
        name: fileData.metadataFile.name,
        downloadURLs: fileData.metadataFile.downloadURLs,
        fullPath: fileData.metadataFile.fullPath,
        size: (fileData.metadataFile.size),
        contentType: fileData.metadataFile.contentType,
      }

      rows.push(objRows)
    }

    this.setState({
      rows: rows
    }, () => {
      console.log('Set Rows')
    })

  }

  handleInit() {
    // handle init file upload here
    console.log('now initialised', this.pond);
  }

  handleProcessing(fieldName, file, metadata, load, error, progress, abort) {
    // handle file upload here
    console.log(" handle file upload here");
    console.log(file);

    const fileUpload = file;
    const storageRef = firebase.storage().ref(`filepond/${file.name}`);
    const task = storageRef.put(fileUpload)

    task.on(`state_changed`, (snapshort) => {
      console.log(snapshort.bytesTransferred, snapshort.totalBytes)
      let percentage = (snapshort.bytesTransferred / snapshort.totalBytes) * 100;
      //Process
      this.setState({
        uploadValue: percentage
      })
    }, (error) => {
      //Error
      this.setState({
        messag: `Upload error : ${error.message}`
      })
    }, () => {
      //Success
      this.setState({
        messag: `Upload Success`,
        picture: task.snapshot.downloadURL //เผื่อนำไปใช้ต่อในการแสดงรูปที่ Upload ไป
      })

      //storageRef.getMetadata().then((metadata) => {
        // Metadata now contains the metadata for 'filepond/${file.name}'
        //let metadataFile = {
          //name: metadata.name,
          //size: metadata.size,
          //contentType: metadata.contentType,
          //fullPath: metadata.fullPath,
          //downloadURLs: metadata.downloadURLs[0],
        //}

        //const databaseRef = firebase.database().ref('/filepond');

        //databaseRef.push({
        //  metadataFile
      //  });

      //})
      //.catch(function (error) {
      //  this.setState({
      //    messag: `Upload error : ${error.message}`
      //  })
      //});
    })
  }

  render() {

    const { rows, filesMetadata } = this.state;

    return (

      <div className="App">

        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>

        <p className="App-intro">
          React Cloud Storage for Firebase <code>src/App.js</code> Upload & Download & Delete.
</p>


        <div className="Margin-25">
          <FilePond allowMultiple={true}
            maxFiles={3}
            ref={ref => this.pond = ref}
            server={{ process: this.handleProcessing.bind(this) }}
            oninit={() => this.handleInit()}>

            {this.state.files.map(file => (
              <File key={file} source={file} />
            ))}

          </FilePond>

          <StorageDataTable
            rows={rows}
            filesMetadata={filesMetadata}
            deleteData={this.deleteMetaDataFromDatabase}
          />
        </div>
      </div>
    );
  }
}
export default App;
