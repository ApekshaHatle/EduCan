const mic_btn = document.querySelector('#mic');
const playback=document.querySelector('.playback');

mic_btn.addEventListener('click',ToggleMic);

let can_record=false;
let is_recording=false;

let recorder=null;

let chunks = [];

function SetupAudio(){                    //getting access to microphone etc.
    console.log("Setup");
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices
            .getUserMedia({
                audio : true
            })
            .then(SetupStream)
            .catch(err => {
                console.error(err)
            });
    }
}

// function SetupStream(stream){
//     recorder= new MediaRecorder(stream);

//     recorder.ondataavailable = e =>{
//         chunks.push(e.data); 
//     }

//     recorder.onstop = e => {
//         const blob = new Blob(chunks, { type: "audio/wav" }); // Change to audio/wav if needed
//         chunks = [];
//         const audioURL = window.URL.createObjectURL(blob);
    
//         // Create a link to download the WAV file
//         const a = document.createElement('a');
//         a.href = audioURL;
//         a.download = 'recording.wav'; // Give a name for the recorded file
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
    
//         // Set the playback source
//         playback.src = audioURL;
//     };
    

//     can_record = true;
// }

function SetupStream(stream) {
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => {
        chunks.push(e.data); 
    };

    recorder.onstop = async () => {
        // Create a new Blob with the recorded audio chunks
        const blob = new Blob(chunks, { type: "audio/webm" }); // This captures the audio as webm
        chunks = [];
        
        // Convert WebM to WAV
        const wavBlob = await convertWebMToWAV(blob);

        // Create a link to download the WAV file
        const a = document.createElement('a');
        a.href = URL.createObjectURL(wavBlob);
        a.download = 'recording.wav'; // Give a name for the recorded file
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Set the playback source
        playback.src = URL.createObjectURL(wavBlob);
    };

    can_record = true;
}

// Function to convert WebM to WAV using the Web Audio API
async function convertWebMToWAV(webmBlob) {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16; // 16 bits

    const bytesPerSample = bitDepth / 8;
    const bufferLength = buffer.length;
    const wavBufferLength = 44 + bufferLength * numChannels * bytesPerSample;

    const bufferArray = new ArrayBuffer(wavBufferLength);
    const view = new DataView(bufferArray);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, wavBufferLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength * numChannels * bytesPerSample, true);

    // Write PCM samples
    let offset = 44;
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < bufferLength; i++) {
            view.setInt16(offset, channelData[i] * 0x7FFF, true);
            offset += bytesPerSample;
        }
    }

    return bufferArray;

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

function ToggleMic(){
    if(!can_record) return;
    is_recording=!is_recording;
    if(is_recording){
        recorder.start();
        mic_btn.classList.add("is-recording");
    } else{
        recorder.stop();
        mic_btn.classList.remove("is-recording");
    } 
}


SetupAudio();
//change navbar styles on scroll

window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0)
});

const retryBtn = document.getElementById('retryBtn');

retryBtn.addEventListener('click', function() {
    // Cleanup before retrying
    fetch('/cleanup', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
            throw new Error('Cleanup failed.');
        }
        console.log('Cleanup completed successfully.');

        // Optionally, reset the playback audio source
        //playback.src = ''; // Reset playback

        // Reset any other UI elements if necessary
        // For example, reset the chart
        resetChart();

        // Optionally, reset recording states
        //is_recording = false;
        //mic_btn.classList.remove("is-recording");
        
        // Inform the user
        alert('Ready to record again!');
    })
    .catch(error => {
        alert('An error occurred during cleanup: ' + error);
    });
});

// Function to reset the chart (if needed)
let currentChart = null; // Variable to hold the chart instance

function resetChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Destroy the existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create a new chart
    currentChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}



document.getElementById('analyzeBtn').addEventListener('click', function() {
    // Step 1: Perform the analysis
    fetch('/analyze', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Analysis complete! Output: ' + data.output);
            
            // Step 2: Fetch the updated data for the chart
            return fetch('/static/data.json');
        } else {
            alert('Error: ' + data.message);
            throw new Error(data.message); // Propagate error to the next catch
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch updated data.');
    })
    .then(chartData => {
        createChart(chartData, 'radar'); // Update the chart with new data
    })
    .catch(error => {
        alert('An error occurred: ' + error);
    });
});

// Function to create the chart
function createChart(data, type) {
    // Destroy the current chart if it exists before creating a new one
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Create a new chart instance and store it
    currentChart = new Chart(ctx, { 
        type: type,
        data: {
            labels: data.map(row => row.attribute),
            datasets: [{
                label: 'Score',
                data: data.map(row => row.score),
                backgroundColor: 'rgba(247, 89, 57, 0.6)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    pointLabels: {
                        display: true
                    },
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value;
                        }
                    }
                }
            },
            maintainAspectRatio: false
        }
    });
}
