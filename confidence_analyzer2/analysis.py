mysp = __import__("my-voice-analysis")
p = "recording"  # Audio File title
c = r"D:\Workspace\Web_Workspace\EducationWebsite\confidence_analyzer2\recorded_audio"  # Path to the Audio_File directory (Python 3.7)

import json
import io
import sys

def extract_numeric_value(output, keyword):
    for line in output.splitlines():
        if keyword in line:
            # Check for the specific format with a colon before the numeric value
            if ":" in line:
                return float(line.split(':')[1].strip())
            else:
                return float(line.split('=')[1].split('#')[0].strip())


def capture_output(function, p, c):
    # Redirect standard output to capture the printed result
    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout

    # Call the function
    function(p, c)

    # Reset standard output to original
    sys.stdout = old_stdout

    # Get the printed output
    return new_stdout.getvalue()

# Capture the output and extract the values
ros_output = capture_output(mysp.myspsr, p, c)
ros = extract_numeric_value(ros_output, "rate_of_speech")

articulation_rate_output = capture_output(mysp.myspatc, p, c)
articulation_rate = extract_numeric_value(articulation_rate_output, "articulation_rate")

pauses_output = capture_output(mysp.mysppaus, p, c)
num_pauses = extract_numeric_value(pauses_output, "number_of_pauses")

balance_output = capture_output(mysp.myspbala, p, c)
balance = extract_numeric_value(balance_output, "balance")

f0_mean_output = capture_output(mysp.myspf0mean, p, c)
f0_mean = extract_numeric_value(f0_mean_output, "f0_mean")

f0_std_output = capture_output(mysp.myspf0sd, p, c)
f0_std = extract_numeric_value(f0_std_output, "f0_SD")

pronunciation_output = capture_output(mysp.mysppron, p, c)
pronunciation = extract_numeric_value(pronunciation_output, "Pronunciation_posteriori_probability_score_percentage")


# Example scoring logic (adjust as needed based on the actual data)
scores = [
    {"attribute": "Rate of Speech", "score": 9 if 5 <= ros <= 6 else 7 if 4 <= ros < 5 else 5},
    {"attribute": "Articulation Rate", "score": 9 if 6 <= articulation_rate <= 7 else 7 if 5 <= articulation_rate < 6 else 5},
    {"attribute": "Pauses", "score": 9 if num_pauses <= 1 else 7 if num_pauses <= 3 else 5},
    {"attribute": "Balance of Speaking Duration to Total Duration", "score": 9 if 0.8 <= balance <= 0.9 else 7 if 0.7 <= balance < 0.8 else 5},
    {"attribute": "Pitch", "score": 9 if 150 <= f0_mean <= 200 and f0_std < 30 else 7 if 130 <= f0_mean < 150 or f0_mean > 200 else 5},
    {"attribute": "Pronunciation", "score": 9 if pronunciation >= 90 else 7 if pronunciation >= 80 else 5}
]

# Save to JSON
with open('D:\Workspace\Web_Workspace\EducationWebsite\confidence_analyzer2\static\data.json', 'w') as json_file:
    json.dump(scores, json_file, indent=4)

print("Confidence scores have been saved to data.json")

