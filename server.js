function test() {
    const test_dict = {
        "staff": "test"
    }
    postSpreadsheet(test_dict)
}

/**
 * GETリクエストの処理
 * @returns {HTTP response}
 */
function doGet() {
    var template = HtmlService.createTemplateFromFile("index");
    const db = new DB()
    template.columns = db.columns
    template.rows = db.rows
    return template.evaluate();
}

/**
 * クライアント側のPOSTメソッドに対応する関数
 * @param {Object<string, any>} [dict] column: value
 */
function postSpreadsheet(dict) {
    const db = new DB()
    db.post(dict)
}

class DB{
    /**
     * スプレッドシートのデータを取得
     */
    constructor() {
        this._sheet = SpreadsheetApp.getActiveSheet()
        const cells = this._sheet.getDataRange().getValues()
        this._columns = ["id"].concat(cells.shift())
        this.COLUMN_DATA_TYPE = ["date", "string", "datetime", "datetime"]
        this._rows = cells.map((row, i) => {
            return [i].concat(row.map((v, i) => {
                if(this.COLUMN_DATA_TYPE[i] == "date") {
                    return this.toStringFromDate(v)
                } else if(this.COLUMN_DATA_TYPE[i] == "datetime") {
                    return this.toStringFromDate(v, {"datetime": true})
                } else {
                    return v
                }
            }))
        })
    }

    /**
     * Date型を文字列へ変換
     * @param {Date} [date] 
     * @param {Object} [option] 
     * @returns {string} YYYY/MM/DD hh:mm::ss or hh:mm or ""
     */
    toStringFromDate(date = new Date(), option = {}) {
        const isInvalidDate = (arg) => Number.isNaN((new Date(arg)).getTime())
        if(!isInvalidDate(date)) {
            if(option && "datetime" in option) {
                return (new Date(date)).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
            } else {
                return (new Date(date)).toLocaleTimeString("ja-JP")
            }
        } else {
            return date
        }
    }

    /**
     * 
     * @returns {Array} データベースのcolumns
     */
    get columns() {
        return this._columns
    }

    /**
     * @returns {Array<Array>} データベースのrows
     */
    get rows() {
        return this._rows
    }

    /**
     * 条件に一致する行を取得する
     * 条件を指定しない場合は全取得
     * @param {Array<string>} [columns] 複数のカラム
     * @param {Array<>} [values] 複数の完全一致する条件
     * @returns {Array} 条件に一致する行
     */
    get(columns = [], values = []) {
        let res = this.rows
        for(const i in columns) {
            const col_index = this._columns.indexOf(columns[i])
            if(col_index < 0) {
                continue
            }
            res = res.filter(row => row[col_index] == values[i])
        }
        return res        
    }

    /**
     * スプレッドシートにpost
     * @param {Object<string, any>} [dict] postするcolumn: value 
     */
    post(dict = {}) {
        dict["timestamp"] = new Date()
        const row = this.columns
            .map(column => column in dict ? dict[column] : "")
        row.shift()
        this._sheet.appendRow(row)
    }
}