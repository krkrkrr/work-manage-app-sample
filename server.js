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

class DB{
    /**
     * スプレッドシートのデータを取得
     */
    constructor() {
        this._sheet = SpreadsheetApp.getActiveSheet()
        const cells = this._sheet.getDataRange().getValues()
        this._columns = cells.shift()
        this.COLUMN_DATA_TYPE = ["date", "string", "datetime", "datetime"]
        this._rows = cells.map(row => {
            return row.map((v, i) => {
                if(this.COLUMN_DATA_TYPE[i] == "date") {
                    return this.toStringFromDate(v)
                } else if(this.COLUMN_DATA_TYPE[i] == "datetime") {
                    return this.toStringFromDate(v, {"datetime": true})
                } else {
                    return v
                }
            })
        })
    }

    /**
     * Date型を文字列へ変換
     * @param {Date} date 
     * @param {Object} option 
     * @returns {string} YYYY/MM/DD hh:mm::ss or hh:mm or ""
     */
    toStringFromDate(date, option) {
        const isInvalidDate = (arg) => Number.isNaN((new Date(arg)).getTime())
        if(!isInvalidDate(date)) {
            if(option && "datetime" in option) {
                return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
            } else {
                return date.toLocaleDateString("ja-JP")
            }
        } else {
            return ""
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
}