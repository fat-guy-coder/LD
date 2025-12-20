const aiGuidance = {
  project: {
    name: 'vld', //项目名称
    version: '0.1.0', //版本
    slogan: '极致性能前端框架', //口号
    lastUpdated: '2025-12-20T12:00:00Z', //最后更新时间
    fileExtension: '.vue', //文件扩展名
    vueCompatibility: '完全兼容Vue3语法和生态', //Vue3
    goal: 'light!fast!performance!typescript!vue!', //目标
    currentModuleId: 'reactivity-computed.ts', //当前模块的id 大模块id-小模块id
  },
  //这个你自己设置
  aiModelConfig: {
    currentContextWindow: 128000, //你对话的上下文窗口大小
    availableTokensForGeneration: 115000, //你对话的可用token数
    tokensPerLine: 10, //每行token数
    maxLinesPerGeneration: 1500, //每批生成最大行数
    safetyBufferPercent: 10, //安全缓冲百分比
    intelligentBatching: {
      strategy:
        '根据复杂度和依赖关系动态调整,先根据firstRule和case1-4判断可批量生成多少个文件,然后根据文件的复杂度和依赖关系动态调整', //智能批量生成策略
      rules: {
        firstRule:
          '如果当前模块文件要引用之前生成的模块的导出，先处理引入的东西(类型和描述判断其功能)，然后再处理生成这个模块文件,然后当前模块引入的用import记录,导出的export中记录导出的东西,此时一个会话处理一个模块也可以',
        case1: "文件功能复杂度为'低'和依赖关系低(或者没有),可批量生成3-4个文件",
        case2: "文件功能复杂度为'中'且依赖关系低(或者没有),可批量生成2-3个文件",
        case3: "文件功能复杂度为'高'且依赖关系中,可批量生成1-2个文件",
        case4: "文件功能复杂度为'非常高'且依赖关系(任一情况),专注单文件生成",
      },
    },
  },
  //一些实现原则
  corePrinciples: {
    nonNegotiable: {
      zeroBugs: true,
      extremePerformance: true,
      fullVue3Compatibility: true,
      typeSafety: true,
      memorySafety: true,
      minimalBundleSize: true,
    },
    performanceTargets: {
      signalCreate: '<0.01ms',
      signalGet: '<0.001ms',
      signalSet: '<0.005ms',
      bundleSize: '<10KB gzipped',
      componentMount: '<0.1ms',
      componentUpdate: '<0.05ms',
    },
    architecture: {
      noVirtualDOM: true,
      signalBased: true,
      treeShakable: true,
      esModules: true,
      modernBrowsersOnly: true,
      multiThreaded: true,
      viewportPriority: true,
    },
    optimizations: {
      aotCompilation: true,
      staticHoisting: true,
      constantFolding: true,
      memoryPooling: true,
      cachingEverything: true,
      lazyEvaluation: true,
      deadCodeElimination: true,
    },
  },
  qualityEnforcement: {
    codeGeneration: {
      preGenerationChecklist: [
        '分析所有边界情况',
        '考虑性能最优算法',
        '设计内存安全策略',
        '确保类型完全正确',
        '规划测试用例',
      ],
      inGenerationRequirements: [
        '每个函数必须标注时间和空间复杂度',
        '关键算法必须有详细优化注释',
        '必须处理所有可能的错误情况',
        '内存分配和释放必须明确',
        '导出必须完整且类型安全',
      ],
      postGenerationValidation: [
        '代码逻辑正确性验证',
        '性能目标可达性验证',
        '内存安全性验证',
        '类型兼容性验证',
        '体积优化验证',
      ],
    },
    performanceAnnotations: {
      required: true,
      format: '// 复杂度: 时间O(n)/空间O(m)，优化: [具体优化描述]',
      benchmarkMarkers: true,
    },
  },
  //全部大模块的上下文
  moduleContext: {
    dependencies: {
      description:
        '主要收集上个大模块(大模块的index.ts会收集当前大模块中的小模块导出然后一起导出)暴露的导出,并根据依赖关系生成当前模块的依赖关系，这里只是做例子',
      list: [
        {
          reactivity: {
            exports: {
              'Signal<T>': {
                type: 'type',
                description: 'Signal接口定义',
              },
              'SignalOptions<T>': {
                type: 'interface',
                description: 'Signal配置选项类型',
              },
              activeEffect: {
                type: 'variable',
                description: '当前活动的effect',
              },
              createSignal: {
                type: 'function',
                description: '创建Signal',
              },
            },
          },
        },
      ],
    },
  },
  modules: {
    reactivity: {
      priority: 1,
      complexity: '非常高',
      mission: '实现零虚拟DOM的细粒度更新系统，性能超越所有现有方案',
      //之后的小模块都跟signal.ts和effect.ts和index.ts一样(格式)
      module: [
        {
          'signal.ts': {
            mission: '实现零虚拟DOM的细粒度更新系统，性能超越所有现有方案',
            complexity: '非常高',
            requirements: [
              '自定义相等函数支持',
              '内存池复用Signal实例',
              'WeakMap缓存依赖关系',
              '生产环境去除调试代码',
              '支持Symbol作为key',
              'TypeScript泛型完美支持',
              '嵌套effect自动追踪',
              '循环依赖检测',
              '调试模式性能监控',
              '内存泄漏检测',
            ],
            export: {
              'EqualityFn<T>': {
                type: 'type',
                description: '相等性比较函数类型',
              },
              'Signal<T>': {
                type: 'type',
                description: 'Signal接口定义',
              },
              'SignalOptions<T>': {
                type: 'interface',
                description: 'Signal配置选项类型',
              },
              activeEffect: {
                type: 'variable',
                description: '当前活动的effect',
              },
              createSignal: {
                type: 'function',
                description: '创建Signal',
              },
            },
          },
        },
        {
          'effect.ts': {
            mission: '核心依赖链，必须一起生成确保接口一致',
            complexity: '高',
            requirements: [
              '嵌套effect支持',
              '清理函数机制',
              'effect优先级调度',
              'effect去重优化',
              '批量执行优化',
              '错误边界处理',
              '异步effect支持',
              '导入activeEffect/effectStack',
            ],
            import: {
              activeEffect: {
                type: 'variable',
                description: '当前活动的effect',
                from: 'signal.ts',
              },
              effectStack: {
                type: 'variable',
                description: 'effect栈',
                from: 'signal.ts',
              },
            },
            export: {
              createEffect: {
                type: 'function',
                description: '创建Effect',
              },
              track: {
                type: 'function',
                description: '手动追踪依赖',
              },
              cleanup: {
                type: 'function',
                description: '清理依赖',
              },
            },
          },
        },
        {
          'index.ts': {
            reason: '模块导出入口，类型重导出',
            import: {
              //这里需要把上一个大模块暴露出的导出收集，这里只是举例子
              activeEffect: {
                type: 'variable',
                description: '当前活动的effect',
                from: 'signal.ts',
              },
              effectStack: {
                type: 'constant',
                description: 'effect栈',
                from: 'signal.ts',
              },
            },
            export: {
              //这里需要把signal.ts和effect.ts(以及当前其他小模块)的导出导入进来,然后重导出
              createEffect: {
                type: 'function',
                description: '创建Effect',
              },
              track: {
                type: 'function',
                description: '手动追踪依赖',
              },
              cleanup: {
                type: 'function',
                description: '清理依赖',
              },
            },
          },
        },
        {
          batchId: 2,
          files: ['computed.ts', 'reactive.ts'],
          reason: '基于signal的核心扩展',
          totalLines: 600,
          estimatedTokens: 9000,
        },
        {
          batchId: 3,
          files: ['batch.ts', 'scheduler.ts', 'untracked.ts'],
          reason: '调度和批量更新系统',
          totalLines: 530,
          estimatedTokens: 7000,
        },
        {
          batchId: 4,
          files: ['utils/equals.ts', 'utils/debug.ts', 'utils/memory.ts', 'index.ts'],
          reason: '工具函数和模块导出',
          totalLines: 360,
          estimatedTokens: 5000,
        },
      ],
      files: {
        'signal.ts': {
          complexity: '高',
          estimatedLines: 300,
          core: 'Signal工厂函数，依赖收集，批量更新标记',
          perfTarget: 'signal创建<0.01ms，getter<0.001ms，setter<0.005ms',
          criticalExports: ['createSignal', 'get', 'set', 'activeEffect', 'effectStack'],
          requirements: [
            '自定义相等函数支持',
            '内存池复用Signal实例',
            'WeakMap缓存依赖关系',
            '生产环境去除调试代码',
            '支持Symbol作为key',
            'TypeScript泛型完美支持',
            '嵌套effect自动追踪',
            '循环依赖检测',
            '调试模式性能监控',
            '内存泄漏检测',
            'SSR友好',
          ],
        },
        'effect.ts': {
          complexity: '高',
          estimatedLines: 250,
          core: '副作用追踪，自动依赖收集，清理机制',
          criticalExports: ['createEffect', 'track', 'cleanup'],
          requirements: [
            '嵌套effect支持',
            '清理函数机制',
            'effect优先级调度',
            'effect去重优化',
            '批量执行优化',
            '错误边界处理',
            '异步effect支持',
            '导入activeEffect/effectStack',
          ],
        },
        'computed.ts': {
          complexity: '中高',
          estimatedLines: 200,
          core: '计算属性，惰性求值+缓存，脏标记机制',
          criticalExports: ['createComputed'],
          requirements: [
            '依赖自动追踪',
            '脏标记机制',
            '缓存未变值',
            '惰性求值优化',
            '循环计算检测',
            '调试信息收集',
            '内存高效缓存策略',
          ],
        },
        'reactive.ts': {
          complexity: '非常高',
          estimatedLines: 400,
          core: 'Proxy响应式对象，深层属性响应式，数组方法拦截',
          criticalExports: ['createReactive', 'isReactive', 'toRaw'],
          requirements: [
            '深层属性响应式',
            '数组方法拦截(push/pop/shift/unshift/splice)',
            'WeakMap缓存代理对象',
            '性能优化拦截器',
            'Symbol属性跳过代理',
            '不可配置属性处理',
            '原型链正确处理',
            'deleteProperty优化',
            'has陷阱优化',
          ],
        },
        'batch.ts': {
          complexity: '中',
          estimatedLines: 150,
          core: '批量更新系统，微任务调度，effect去重',
          criticalExports: ['batch', 'flushQueuedEffects'],
          requirements: [
            '嵌套batch支持',
            '微任务调度(requestIdleCallback优先)',
            'effect去重',
            '批量更新性能统计',
            '递归深度限制',
            '错误恢复机制',
          ],
        },
        'scheduler.ts': {
          complexity: '高',
          estimatedLines: 300,
          core: '任务调度器，优先级队列+时间切片，多线程准备',
          criticalExports: ['scheduleTask', 'cancelTask'],
          requirements: [
            '优先级队列(紧急/高/中/低/空闲)',
            'requestIdleCallback时间切片',
            '降级策略(setTimeout)',
            '任务取消机制',
            '任务去重',
            '性能监控',
            'Web Worker任务分发准备',
          ],
        },
        'untracked.ts': {
          complexity: '低',
          estimatedLines: 80,
          core: '无依赖追踪读取，防止内存泄漏',
          criticalExports: ['untrack', 'batchUntracked'],
          requirements: ['嵌套untrack支持', '防止内存泄漏', '类型安全包装', '性能零开销'],
        },
        'utils/equals.ts': {
          complexity: '中',
          estimatedLines: 120,
          core: '深度值比较，循环引用检测，性能优化',
          criticalExports: ['equals', 'shallowEquals'],
          requirements: [
            'Object.is快速比较',
            '深度比较优化(缓存结构信息)',
            '循环引用检测',
            'TypedArray支持',
            'Date/RegExp/Set/Map支持',
            '性能benchmark标记',
          ],
        },
        'utils/debug.ts': {
          complexity: '中',
          estimatedLines: 100,
          core: '调试工具，性能监控，内存分析',
          criticalExports: ['enableDebug', 'disableDebug', 'getDebugInfo'],
          requirements: [
            '开发环境调试工具',
            '性能监控钩子',
            '内存使用统计',
            '依赖关系可视化',
            '生产环境自动移除',
          ],
        },
        'utils/memory.ts': {
          complexity: '中',
          estimatedLines: 90,
          core: '内存池管理，对象复用',
          criticalExports: ['SignalPool', 'EffectPool', 'ComputedPool'],
          requirements: [
            'Signal实例池',
            'Effect实例池',
            'Computed实例池',
            '自动垃圾回收',
            '内存使用限制',
          ],
        },
        'index.ts': {
          complexity: '低',
          estimatedLines: 50,
          core: '模块导出入口，类型重导出',
          criticalExports: ['所有API的重新导出'],
          requirements: ['统一导出所有API', '类型定义重导出', '版本信息', '开发模式标记'],
        },
      },
    },
    router: {
      priority: 2,
      complexity: '高',
      mission: '类vue-router路由系统，极致性能优化，支持预加载和智能缓存',
      generationHint: '可批量生成，每次3-4个文件',
      files: [
        'router.ts',
        'matcher.ts',
        'navigation-guards.ts',
        'scroll-behavior.ts',
        'history',
        'link.ts',
        'view.ts',
        'errors.ts',
        'utils/path.ts',
        'utils/query.ts',
        'cache/lru.ts',
      ],
    },
    'compiler-core': {
      priority: 3,
      complexity: '非常高',
      mission: '模板→AST→高效JS代码，支持Vue3语法，编译时极致优化',
      generationHint: '需分批生成，每次2-3个核心文件',
      files: [
        'parser.ts',
        'tokenizer.ts',
        'nodes.ts',
        'walker.ts',
        'optimizer.ts',
        'hoist.ts',
        'generator.ts',
        'context.ts',
        'transforms/',
        'utils/cache.ts',
      ],
    },
    'compiler-sfc': {
      priority: 4,
      complexity: '高',
      mission: '.vue单文件组件编译，支持TypeScript、JSX、Scoped CSS',
      generationHint: '可分批生成，按功能模块',
      files: [
        'parse.ts',
        'compileTemplate.ts',
        'compileScript.ts',
        'compileStyle.ts',
        'descriptor.ts',
        'cache.ts',
        'errors.ts',
      ],
    },
    'runtime-core': {
      priority: 5,
      complexity: '非常高',
      mission: '组件渲染和生命周期运行时引擎，支持Web Worker多线程渲染',
      multithreaded: true,
      generationHint: '需多批次生成，核心渲染器单独生成',
      files: [
        'renderer.ts',
        'patch.ts',
        'component.ts',
        'slots.ts',
        'vnode.ts',
        'scheduler.ts',
        'worker-renderer.ts',
        'error-boundary.ts',
      ],
    },
    'runtime-dom': {
      priority: 6,
      complexity: '中高',
      mission: 'DOM环境运行时适配器，极致DOM操作优化',
      generationHint: '可批量生成，按功能模块',
      files: [
        'create.ts',
        'events.ts',
        'attrs.ts',
        'props.ts',
        'class.ts',
        'style.ts',
        'transition.ts',
        'hydrate.ts',
      ],
    },
    'vld-main': {
      priority: 7,
      complexity: '中',
      mission: '框架主入口和公共API，完全兼容Vue3使用习惯',
      generationHint: '可批量生成，API和实现分开',
      files: [
        'createApp.ts',
        'h.ts',
        'directives/',
        'components/',
        'plugins/',
        'config.ts',
        'global-api.ts',
      ],
    },
    'vite-plugin': {
      priority: 8,
      complexity: '中',
      mission: 'Vite插件，支持.vue文件热更新，深度性能优化',
      files: [
        'index.ts',
        'handleHotUpdate.ts',
        'resolveId.ts',
        'load.ts',
        'transform.ts',
        'dev-server.ts',
        'build.ts',
      ],
    },
    cli: {
      priority: 9,
      complexity: '中',
      mission: '项目脚手架和开发工具，一体化开发体验',
      files: ['create.ts', 'dev.ts', 'build.ts', 'inspect.ts', 'templates/', 'utils/'],
    },
    devtools: {
      priority: 10,
      complexity: '高',
      mission: '浏览器扩展，调试和性能分析，实时性能监控',
      files: [
        'inspector.ts',
        'timeline.ts',
        'component-inspector.ts',
        'performance-monitor.ts',
        'backend/',
        'frontend/',
      ],
    },
  },
  generationWorkflow: {
    currentStep: '生成reactivity模块的第一批文件: signal.ts和effect.ts',
    fileSelectionLogic: [
      '1. 读取currentModule.id确定当前模块和文件',
      '2. 根据aiModelConfig.intelligentBatching确定可生成的文件数量',
      '3. 优先选择依赖链底层的文件',
      '4. 确保一起生成的文件有明确的依赖关系',
      '5. 考虑总代码行数不超过maxLinesPerGeneration',
    ],
    qualityAssuranceProcess: [
      '生成前: 模拟运行和边界情况分析',
      '生成中: 实时验证算法正确性和性能',
      '生成后: 虚拟类型检查和内存安全检查',
    ],
  },
  nextModuleAfterCompletion: {
    currentBatch: 'reactivity-batch1',
    nextBatch: 'reactivity-batch2',
    nextFiles: ['computed.ts', 'reactive.ts'],
    completionTrigger: '生成signal.ts和effect.ts后自动触发',
  },
}
