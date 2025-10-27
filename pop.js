const captureScreen = document.getElementById("captureMe");
const imageContainer = document.getElementById("image");

captureScreen.addEventListener("click",async()=> {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({audio:false, video: true});

        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);

        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.height = Math.floor(bitmap.height/2);
        canvas.width = Math.floor(bitmap.width/ 2);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0 , canvas.width, canvas.height);
        track.stop();

        const base64image = canvas.toDataURL("image/png");
        imageContainer.append(canvas);
        // console.log(base64image)


        chrome.runtime.sendMessage({action: "captureScreen", data: base64image, type: "screenshot", synced: true}, function(response){
            if(chrome.runtime.lasterror){
                console.error("Extension Error", chrome.runtime.lasterror.message);
                return;
            }
            
        });
    } catch (error) {
        console.log("We are facing an error");
    }


})