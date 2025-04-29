module.exports = {
  ok: [
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 527,
        y: 259
      },
      ID: "8142b6b0-285c-11ef-8c29-2f0c6bd4b150",
      type: "if",
      name: "if0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "27fce450-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "290fdaf0-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      condition: "hoge",
      else: []
    },
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 150,
        y: 120
      },
      ID: "27fce450-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [
        "8142b6b0-285c-11ef-8c29-2f0c6bd4b150"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: "run.sh",
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 263,
        y: 318
      },
      ID: "290fdaf0-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "8142b6b0-285c-11ef-8c29-2f0c6bd4b150"
      ],
      next: [
        "2a54b700-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [
        {
          name: "hoge",
          dst: [
            {
              dstNode: "33a16420-239c-11ef-8cf7-6705d44703e7",
              dstName: "hoge"
            }
          ]
        }
      ],
      cleanupFlag: 2,
      script: "run.sh",
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 280,
        y: 490
      },
      ID: "2a54b700-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "290fdaf0-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: "run.sh",
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 500,
        y: 166
      },
      ID: "33a16420-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task3",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [
        {
          name: "hoge",
          src: [
            {
              srcNode: "290fdaf0-239c-11ef-8cf7-6705d44703e7",
              srcName: "hoge"
            }
          ]
        }
      ],
      outputFiles: [],
      cleanupFlag: 2,
      script: "run.sh",
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "0a903cf0-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 696,
        y: 444
      },
      ID: "b2d2bb40-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task4",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: "run.sh",
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  previousNext: [
    {
      parent: "12c4ea60-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 430,
        y: 287
      },
      ID: "50a389e0-239c-11ef-8cf7-6705d44703e7",
      type: "if",
      name: "if0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "4fa023a0-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "51e90230-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      condition: null,
      else: [
        "5558ad80-239c-11ef-8cf7-6705d44703e7"
      ]
    },
    {
      parent: "12c4ea60-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 284,
        y: 159
      },
      ID: "4fa023a0-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "5558ad80-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "50a389e0-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "12c4ea60-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 312,
        y: 404
      },
      ID: "51e90230-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "50a389e0-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "12c4ea60-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 456,
        y: 587
      },
      ID: "5558ad80-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "50a389e0-239c-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "4fa023a0-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  notConnected: [
    {
      parent: "87bf1f70-23bf-11ef-8cf7-6705d44703e7",
      pos: {
        x: 258,
        y: 151
      },
      ID: "98eded30-23bf-11ef-8cf7-6705d44703e7",
      type: "if",
      name: "if0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      condition: null,
      else: []
    },
    {
      parent: "87bf1f70-23bf-11ef-8cf7-6705d44703e7",
      pos: {
        x: 244,
        y: 77
      },
      ID: "96909c40-23bf-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "87bf1f70-23bf-11ef-8cf7-6705d44703e7",
      pos: {
        x: 276,
        y: 265
      },
      ID: "975dd750-23bf-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "87bf1f70-23bf-11ef-8cf7-6705d44703e7",
      pos: {
        x: 617,
        y: 200
      },
      ID: "982768e0-23bf-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  inputOutput: [
    {
      parent: "1cc88b70-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 693,
        y: 95
      },
      ID: "d8f85b40-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [
        {
          name: "hoge",
          src: [
            {
              srcNode: "c1fc6a30-239c-11ef-8cf7-6705d44703e7",
              srcName: "hoge"
            }
          ]
        }
      ],
      outputFiles: [
        {
          name: "foo",
          dst: [
            {
              dstNode: "c0b173a0-239c-11ef-8cf7-6705d44703e7",
              dstName: "foo"
            }
          ]
        }
      ],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "1cc88b70-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 219,
        y: 345
      },
      ID: "c0b173a0-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [],
      inputFiles: [
        {
          name: "foo",
          src: [
            {
              srcNode: "d8f85b40-239c-11ef-8cf7-6705d44703e7",
              srcName: "foo"
            }
          ]
        }
      ],
      outputFiles: [
        {
          name: "bar",
          dst: [
            {
              dstNode: "c1fc6a30-239c-11ef-8cf7-6705d44703e7",
              dstName: "bar"
            }
          ]
        }
      ],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "1cc88b70-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 381,
        y: 529
      },
      ID: "c1fc6a30-239c-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [
        "bf859dd0-239c-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [
        {
          name: "bar",
          src: [
            {
              srcNode: "c0b173a0-239c-11ef-8cf7-6705d44703e7",
              srcName: "bar"
            }
          ]
        }
      ],
      outputFiles: [
        {
          name: "hoge",
          dst: [
            {
              dstNode: "d8f85b40-239c-11ef-8cf7-6705d44703e7",
              dstName: "hoge"
            }
          ]
        }
      ],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  both: [
    {
      parent: "22951280-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 394,
        y: 416
      },
      ID: "2b0c2ab0-239d-11ef-8cf7-6705d44703e7",
      type: "if",
      name: "if0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "27316180-239d-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "49e72f20-239d-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      condition: null,
      else: [
        "2928ebc0-239d-11ef-8cf7-6705d44703e7"
      ]
    },
    {
      parent: "22951280-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 193,
        y: 140
      },
      ID: "264ca6d0-239d-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [
        "27316180-239d-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [
        {
          name: "foo",
          src: [
            {
              srcNode: "2928ebc0-239d-11ef-8cf7-6705d44703e7",
              srcName: "foo"
            }
          ]
        }
      ],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "22951280-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 445,
        y: 320
      },
      ID: "27316180-239d-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "264ca6d0-239d-11ef-8cf7-6705d44703e7"
      ],
      next: [
        "2b0c2ab0-239d-11ef-8cf7-6705d44703e7"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "22951280-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 296,
        y: 548
      },
      ID: "2928ebc0-239d-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "2b0c2ab0-239d-11ef-8cf7-6705d44703e7"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [
        {
          name: "foo",
          dst: [
            {
              dstNode: "264ca6d0-239d-11ef-8cf7-6705d44703e7",
              dstName: "foo"
            }
          ]
        }
      ],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "22951280-239c-11ef-8cf7-6705d44703e7",
      pos: {
        x: 141,
        y: 487
      },
      ID: "49e72f20-239d-11ef-8cf7-6705d44703e7",
      type: "task",
      name: "task3",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "2b0c2ab0-239d-11ef-8cf7-6705d44703e7"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  withTail: [
    {
      parent: "3dc41950-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 208,
        y: 184
      },
      ID: "71715100-26e6-11ef-8b70-5bf5636e4460",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [
        "72a1bab0-26e6-11ef-8b70-5bf5636e4460"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "3dc41950-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 450,
        y: 437
      },
      ID: "72a1bab0-26e6-11ef-8b70-5bf5636e4460",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "71715100-26e6-11ef-8b70-5bf5636e4460",
        "759cf950-26e6-11ef-8b70-5bf5636e4460"
      ],
      next: [
        "7414f9c0-26e6-11ef-8b70-5bf5636e4460"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "3dc41950-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 935,
        y: 433
      },
      ID: "7414f9c0-26e6-11ef-8b70-5bf5636e4460",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "72a1bab0-26e6-11ef-8b70-5bf5636e4460"
      ],
      next: [
        "759cf950-26e6-11ef-8b70-5bf5636e4460"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "3dc41950-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 752,
        y: 292
      },
      ID: "759cf950-26e6-11ef-8b70-5bf5636e4460",
      type: "task",
      name: "task3",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "7414f9c0-26e6-11ef-8b70-5bf5636e4460"
      ],
      next: [
        "72a1bab0-26e6-11ef-8b70-5bf5636e4460"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  branched: [
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 262,
        y: 226
      },
      ID: "9e7004d0-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [],
      next: [
        "a0b8e360-2790-11ef-a6ac-2f44b3871473"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 288,
        y: 472
      },
      ID: "9f7da440-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "a0b8e360-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [
        "a2093120-2790-11ef-a6ac-2f44b3871473",
        "baf2e870-2790-11ef-a6ac-2f44b3871473"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 648,
        y: 336
      },
      ID: "a0b8e360-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "a2093120-2790-11ef-a6ac-2f44b3871473",
        "9e7004d0-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [
        "9f7da440-2790-11ef-a6ac-2f44b3871473"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 694,
        y: 528
      },
      ID: "a2093120-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task3",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "9f7da440-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [
        "a0b8e360-2790-11ef-a6ac-2f44b3871473",
        "a33a1000-2790-11ef-a6ac-2f44b3871473",
        "a4846a50-2790-11ef-a6ac-2f44b3871473"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 495,
        y: 724
      },
      ID: "a33a1000-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task4",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "a2093120-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [
        "c401f050-2790-11ef-a6ac-2f44b3871473"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 948,
        y: 675
      },
      ID: "a4846a50-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task5",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "a2093120-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 152,
        y: 688
      },
      ID: "baf2e870-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task6",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "9f7da440-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "6f03d230-2790-11ef-a6ac-2f44b3871473",
      pos: {
        x: 378,
        y: 800
      },
      ID: "c401f050-2790-11ef-a6ac-2f44b3871473",
      type: "task",
      name: "task7",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "a33a1000-2790-11ef-a6ac-2f44b3871473"
      ],
      next: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  double: [
    {
      parent: "66e85350-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 277,
        y: 156
      },
      ID: "e70f86b0-26e7-11ef-8c4b-f7f88efdd21e",
      type: "task",
      name: "task0",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "e97c40f0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      next: [
        "e859e100-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "66e85350-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 239,
        y: 370
      },
      ID: "e859e100-26e7-11ef-8c4b-f7f88efdd21e",
      type: "task",
      name: "task1",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "e70f86b0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      next: [
        "e97c40f0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "66e85350-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 470,
        y: 406
      },
      ID: "e97c40f0-26e7-11ef-8c4b-f7f88efdd21e",
      type: "task",
      name: "task2",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "e859e100-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      next: [
        "e70f86b0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "66e85350-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 941,
        y: 137
      },
      ID: "f5f0baf0-26e7-11ef-8c4b-f7f88efdd21e",
      type: "task",
      name: "task3",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "f772ee20-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      next: [
        "f772ee20-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    },
    {
      parent: "66e85350-26e6-11ef-8b70-5bf5636e4460",
      pos: {
        x: 948,
        y: 381
      },
      ID: "f772ee20-26e7-11ef-8c4b-f7f88efdd21e",
      type: "task",
      name: "task4",
      description: null,
      env: {},
      disable: false,
      state: "not-started",
      previous: [
        "f5f0baf0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      next: [
        "f5f0baf0-26e7-11ef-8c4b-f7f88efdd21e"
      ],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      script: null,
      host: "localhost",
      useJobScheduler: false,
      queue: null,
      submitOption: null,
      include: [],
      exclude: []
    }
  ],
  noComponents: []
};
