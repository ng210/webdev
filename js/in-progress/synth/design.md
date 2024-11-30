# Synth app

## Features
#### Data import/export
1. Formats supported: binary
1. Load data from URL
1. Download data
1. Online import/export
    1. store and load data from server store
---

#### Soundbanks
1. Edit sounds
    1. Add/remove named instruments
    1. Change potmeter values
    1. Visualize potmeters
---

#### Sequences
1. Edit sequences
    1. Add/remove named sequences
    1. Add/remove _synth_ commands
    1. Edit command parameters
    1. Visualize commands
 - import/export
 - download/upload
---
#### Playback
1. Play sequences
1. Navigation

## Modules

#### Data
1. __Load resource from URL__
``` JavaScript
async function loadResource(url)
```
Returns: data or error

1. __Download data__
``` JavaScript
function downloadResource(data)
```
Returns: void

---
#### UI
1. __Create main GUI__
1. __Menu__
1. __Dialogues__
    1. Load/Upload
        - Label
        - Textbox/Upload file
        - Button
    2. Download
        - Label
        - Textbox
        - Button
---
#### Soundbank
1. __Manage soundbank data__
1. __Import soundbank__ from loaded binary resource
``` JavaScript
static Soundbank Soundbank.load(data)
```
Returns: _SoundBank_ object

1. __Export soundbank__ as binary resource
``` JavaScript
UInt8Array Soundbank.save(soundBank)
```
Returns: binary sound-bank data

1. __Create__ _SynthControl_ for visualization
    1. Select instrument (sound-bank item)
    1. Controls for each potmeter
    1. Mapping between controls and instrument elements
---

#### Sequence
1. __Manage sequences__
1. __Import sequences__ from loaded binary resource
``` JavaScript
static Sequence Sequence.load(data)
```
Returns: _Sequence_ object

1. __Export soundbank__ as binary resource
``` JavaScript
UInt8Array Sequence.save()
```
Returns: binary sequence data

1. __Create__ _SequenceControl_ for visualization
    1. Select command
    1. Edit parameters
---

#### Playback
1. __Start/Stop/Navigate playback__
``` JavaScript
void Playback.start()
void Playback.stop()
void Playback.setPosition(frame)
```
1. __Playback of selected sequence__
``` JavaScript
void Playback.start(sequence)
void Playback.stop(sequence)
void Playback.setPosition(sequence, frame)
```
---

#### Sound
Sound playback via callback
``` JavaScript
function playerBasedFillBuffer(left, right, bufferSize)
```