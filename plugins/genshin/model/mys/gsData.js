import YAML from 'yaml'
import chokidar from 'chokidar'
import fs from 'node:fs'

/** 数据文件 */
class GsData {
    constructor() {
        /** 监听文件 */
        this.watcher = {}
    }

    /**
     * @param app  数据文件名
     * @param name 查询名
     */
    getData(app, name) {
        let key = `${app}.${name}`;
        if (this.data[key]) return this.data[key]
        try {
            let d = this.getYaml(app);
            this.data[key] = d[name]
            return this.data[key]
        } catch (error) {
            logger.error(`[${app}] 格式错误 ${error}`)
            return false
        }
    }
    /**
     * 获取数据文件yaml
     * @param app 数据文件名
     */
    getYaml(app) {
        let file = `./plugins/data/mys/${app}.yaml`
        let key = `${app}`

        if (this[key]) return this[key]

        try {
            this[key] = YAML.parse(
                fs.readFileSync(file, 'utf8')
            )
        } catch (error) {
            logger.error(`[${app}] 格式错误 ${error}`)
            return false
        }

        this.watch(file, app)

        return this[key]
    }
    /**
     * 
     * @param {string} app 数据文件名
     * @param {string} name 保存数据名
     * @param {object} yaml 保存数据
     * @returns 
     */
    saveYaml(app, name, yaml) {
        let file = `./plugins/data/mys/${app}.yaml`
        let data = (() => {
            let d = this.getYaml(app, name)
            d[name] = yaml
            return YAML.stringify(d)
        })()
        try {
            fs.writeFileSync(file, data, 'utf8')
            return true
        } catch (error) {
            logger.errtor(`保存错误：[${app}][${name}] 格式错误 ${error}`)
            return false
        }
    }
    /** 监听配置文件 */
    watch(file, app) {
        let key = `${app}`

        if (this.watcher[key]) return

        const watcher = chokidar.watch(file)
        watcher.on('change', path => {
            delete this[key]
            logger.mark(`[修改数据文件][${app}]`)
            if (this[`change_${app}`]) {
                this[`change_${app}`]()
            }
        })

        this.watcher[key] = watcher
    }
}
export default new GsData()