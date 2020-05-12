import { fork, ChildProcess } from 'child_process'

const childReg: Record<string, string> = {}

const hotelRange = ['1', '99']
 const child: ChildProcess = fork('./genRDFs', hotelRange)
