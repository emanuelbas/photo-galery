import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@Capacitor/core';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";

  constructor() { }


  public async addNewToGallery() {
  	//Take a photo

  	const capturedPhoto = await Camera.getPhoto({
  		resultType: CameraResultType.Uri,
  		source: CameraSource.Camera,
  		quality: 100
  	});
  	const savedImageFile = await this.savePicture(capturedPhoto);
  	this.photos.unshift({
  		filepath: 'Soon...',
  		webviewPath: capturedPhoto.webPath
  	});

  	Storage.set({
  		key: this.PHOTO_STORAGE,
  		value: JSON.stringify(this.photos.map(p => {
  			//No guardo la representacion en base64
  			//Eso ya se guardo en el sistema de archivos
  			const photoCopy = {...p};
  			delete photoCopy.base64;
  			return photoCopy;
  		}))
  	});
  }

  public async savePicture(cameraPhoto: CameraPhoto){
  	//Convert photo to base64 format, required by Filesystem API to savePicture
  	const base64Data = await this.readAsBase64(cameraPhoto);

  	//Write the file to the data FilesystemDirectory
  	const fileName = new Date().getTime() + '.jpeg';
  	await Filesystem.writeFile({
  		path: fileName,
  		data: base64Data,
  		directory: FilesystemDirectory.Data
  	});

  	//Get platform-specific photo filepaths
  	return await this.getPhotoFile(cameraPhoto, fileName);
  }

  private async readAsBase64(cameraPhoto: CameraPhoto){
  	//Fetch the photo, read as a blob, then convert to base64 format
  	const responce = await fetch(cameraPhoto.webPath!);
  	const blob = await responce.blob();

  	return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve,reject) => {
  	const reader = new FileReader;
  	reader.onerror = reject;
  	reader.onload = () => {
  		resolve(reader.result)
  	};
  	reader.readAsDataURL(blob);
  });

  private async getPhotoFile(cameraPhoto: CameraPhoto, fileName: string): Promise<Photo> {
  	return {
  		filepath: fileName,
  		webviewPath: cameraPhoto.webPath
  	};
  };

  public async loadSaved(){
  	//Saca fotos del array
  	const photos = await Storage.get({key: this.PHOTO_STORAGE});
  	this.photos = JSON.parse(photos.value) || [];

  	//Muestra la foto leyendola en base64
  	for (let photo of this.photos) {

  		//Read each saved phto's data from the Filesystem
  		const readFile = await Filesystem.readFile({
  			path: photo.filepath,
  			directory: FilesystemDirectory.Data
  		});

  		// Web platform only: Save the photo into the base64 field
  		photo.base64 = `data:image/jpeg;base64,${readFile.data}`;
  	}


  };




}

interface Photo {

	filepath: string;
	webviewPath: string;
	base64?: string;
}
