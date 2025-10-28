import { Plugin } from '../../core/types'

export interface GoogleSheetsConfig {
  apiKey: string
  spreadsheetId: string
  baseUrl?: string
}

export interface GoogleSheetsRow {
  id: string
  values: string[]
  rowNumber: number
}

export interface GoogleSheetsRange {
  sheetName: string
  startRow: number
  endRow: number
  startColumn: string
  endColumn: string
}

export class GoogleSheetsDataSource implements Plugin {
  public readonly name = 'google-sheets-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'Google Sheets data source plugin'
  public readonly dependencies = []

  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Google Sheets data source plugin...')
    // 验证配置
    if (!this.config.apiKey || !this.config.spreadsheetId) {
      throw new Error('Google Sheets API key and spreadsheet ID are required')
    }
    console.log('Google Sheets data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Google Sheets data source plugin...')
    console.log('Google Sheets data source plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        spreadsheetId: this.config.spreadsheetId,
        baseUrl: this.config.baseUrl
      }
    }
  }

  async fetchRange(range: string): Promise<GoogleSheetsRow[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.values.map((row: string[], index: number) => ({
        id: `row-${index}`,
        values: row,
        rowNumber: index + 1
      }))
    } catch (error) {
      console.error('Failed to fetch range from Google Sheets:', error)
      throw error
    }
  }

  async updateRange(range: string, values: string[][]): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: values
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to update range in Google Sheets:', error)
      throw error
    }
  }

  async appendRow(sheetName: string, values: string[]): Promise<void> {
    try {
      const range = `${sheetName}!A:Z`
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}:append`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [values]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to append row to Google Sheets:', error)
      throw error
    }
  }

  async deleteRow(sheetName: string, rowNumber: number): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}/sheets/${sheetName}:deleteDimension`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: {
              sheetId: sheetName,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete row from Google Sheets:', error)
      throw error
    }
  }

  async createSheet(sheetName: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to create sheet in Google Sheets:', error)
      throw error
    }
  }

  async deleteSheet(sheetName: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v4/spreadsheets/${this.config.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [{
              deleteSheet: {
                sheetId: sheetName
              }
            }]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete sheet from Google Sheets:', error)
      throw error
    }
  }

  async syncData(): Promise<void> {
    try {
      // 同步数据
      const range = 'A:Z'
      const rows = await this.fetchRange(range)
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${rows.length} rows from Google Sheets`)
    } catch (error) {
      console.error('Failed to sync data from Google Sheets:', error)
      throw error
    }
  }
}
