from flask import Flask, render_template, request, jsonify
import subprocess
import os
from flask import Flask, jsonify

app = Flask(__name__)

# Path to your recorded audio folder and JSON file
RECORDED_AUDIO_FOLDER = r'D:\Workspace\Web_Workspace\EducationWebsite\confidence_analyzer2\recorded_audio'  # Update this with your actual path
DATA_JSON_PATH = r'D:\Workspace\Web_Workspace\EducationWebsite\confidence_analyzer2\static\data.json'

@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        audio_file = os.path.join(RECORDED_AUDIO_FOLDER, 'recording.wav')
        textgrid_file = os.path.join(RECORDED_AUDIO_FOLDER, 'recording.TextGrid')
        
        # Check if the files exist before attempting to delete
        if os.path.exists(audio_file):
            os.remove(audio_file)
        else:
            print(f"{audio_file} does not exist.")
        
        if os.path.exists(textgrid_file):
            os.remove(textgrid_file)
        else:
            print(f"{textgrid_file} does not exist.")

        # Reset the data.json file
        with open(DATA_JSON_PATH, 'w') as f:
            f.write('[]')

        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, message=str(e))


# Route to serve the frontend (HTML, CSS, JS)
@app.route('/')
def confidence():
    return render_template('confidence.html')


# Endpoint to trigger the analysis
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Run the analysis.py script using subprocess
        result = subprocess.run(['python', 'analysis.py'], check=True, capture_output=True, text=True)

        # Return the output from the Python script to the frontend
        return jsonify({'success': True, 'message': 'Analysis complete!', 'output': result.stdout})
    except subprocess.CalledProcessError as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
