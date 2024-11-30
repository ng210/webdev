# Entities #
Player
- load
- run
- master PlayerDevice
- master data blocks
  - initialization for master device
  - master sequence
  - data blocks for further devices

DataBlock
- initData
- sequence
- user data

Device
- PlayerDevice
- Channel?

Load
- readDataBlockList()
- create master PlayerDevice
- initialize master device from data block #0

PlayerDevice.initialize(dataBlock)
- readSequences
- readDataBlocks
- create devices
- createChannels
- setFrameRate

SynthDevice.initialize(dataBlock)
- setVoiceCount
- setSoundBank
- setProgram