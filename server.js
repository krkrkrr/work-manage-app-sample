function test() {
  const test_dict = {
    staff: 'test',
  }
  postSpreadsheet(test_dict)
}

/**
 * GETリクエストの処理
 * @returns {HTTP response}
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile('index')
  const db = new DB()
  template.columns = db.COLUMN_DISPLAY
  template.rows = db.toString()
  template.url = ScriptApp.getService().getUrl()
  return template.evaluate()
}

/**
 * POSTリクエストの処理
 * @param {Object<string, any>} [req] postするcolumn: value
 * @param {*} db
 */
function post(req, db = new DB()) {
  db.post(req)
}

/**
 * UPDATEリクエストの処理
 * @param {Object<string, any>} [req] updateするcolumn: value
 * @param {*} db
 * @param {int} id 行番号(1, 2, 3, ...)
 */
function update(req, db = new DB(), id, timestamp) {
  req['timestamp'] = new Date()
  req['worktime'] = new Date(
    (new Date() - timestamp + 1000 * 60 * 60 * 15) % (1000 * 60 * 60 * 24)
  )
  db.update(req, id)
}

/**
 * クライアント側のPOSTメソッドに対応する関数
 * @param {Object<string, any>} [req] column: value
 */
function put(req) {
  const db = new DB()
  if ('edit-timestamp' in req) {
    const rows = db.get(['staff'], [req['staff']])
    if (rows.length >= 0) {
      const index = db.columns.indexOf('edit-finished')
      if (index >= 0 && rows[rows.length - 1][index] == '') {
        update(
          req,
          db,
          rows[rows.length - 1][0],
          rows[rows.length - 1][db.columns.indexOf('timestamp')]
        )
        return
      }
    }
  }
  post(req, db)
}

class DB {
  /**
   * スプレッドシートのデータを取得
   */
  constructor() {
    this._sheet = SpreadsheetApp.getActiveSheet()
    const cells = this._sheet.getDataRange().getValues()
    this._columns = ['id'].concat(cells.shift())
    this.COLUMN_DATA_TYPE = ['int', 'date', 'string', 'datetime', 'datetime']
    this.COLUMN_DISPLAY = [
      'ID',
      'タイムスタンプ',
      '作業者',
      '作業時間',
      '動画時間',
      '最後まで編集したか',
    ]
    this._rows = cells.map((row, i) => {
      return [i].concat(row)
    })
  }

  /**
   *
   * @param {Array<Array<any>>} [rows] DBのデータ
   * @returns {Array<Array<string>>} HTML表示向けの文字列
   */
  toString(rows = this.rows) {
    return rows.map((row) => {
      return row.map((v, i) => {
        if (this.COLUMN_DATA_TYPE[i] == 'date') {
          return this.toStringFromDate(v)
        } else if (this.COLUMN_DATA_TYPE[i] == 'datetime') {
          return this.toStringFromDate(v, { datetime: true })
        } else if (this._columns[i] == 'edit-finished') {
          return v ? 'はい' : 'いいえ'
        } else {
          return v
        }
      })
    })
  }

  /**
   * Date型を文字列へ変換
   * @param {Date} [date]
   * @param {Object} [option]
   * @returns {string} YYYY/MM/DD hh:mm::ss or hh:mm or ""
   */
  toStringFromDate(date = new Date(), option = {}) {
    const isInvalidDate = (arg) => Number.isNaN(new Date(arg).getTime())
    if (!isInvalidDate(date)) {
      if (option && 'datetime' in option) {
        return new Date(date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      } else {
        return new Date(date).toLocaleTimeString('ja-JP')
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
    for (const i in columns) {
      const col_index = this._columns.indexOf(columns[i])
      if (col_index < 0) {
        continue
      }
      res = res.filter((row) => row[col_index] == values[i])
    }
    return res
  }

  /**
   * スプレッドシートにpost
   * @param {Object<string, any>} [req] postするcolumn: value
   */
  post(req = {}) {
    req['timestamp'] = new Date()
    const row = this.columns.map((column) => (column in req ? req[column] : ''))
    row.shift()
    this._sheet.appendRow(row)
  }

  /**
   * スプレッドシートの特定行のデータを更新
   * @param {Object<string, any>} [req] 上書きするcolumn: value
   * @param {int} id 行番号(1, 2, 3, ...)
   */
  update(req = {}, id) {
    this.columns.forEach((col, i) => {
      if (col in req) {
        this._sheet.getRange(id + 2, i, 1, 1).setValue(req[col])
      }
    })
  }
}
