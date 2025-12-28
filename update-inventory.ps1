# PowerShell script to add Return button
 = 'c:\Users\MSII\Desktop\dotnet-battery\frontend\src\pages\Inventory.jsx'
 = Get-Content  -Raw -Encoding UTF8

# Find the line with 'flex justify-end gap-2' and insert Return button code after it
 = '(<div className="flex justify-end gap-2">)\s*(<button)'
 = '' + "
" + @'
                                                        {(() => {
                                                            const expiryDate = new Date(battery.purchaseDate);
                                                            expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));
                                                            const isExpired = expiryDate < new Date();
                                                            const isReturned = battery.isReturned;
                                                            return isExpired && !isReturned && (
                                                                <button onClick={() => setReturningBattery(battery)} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all" title="Return Expired Battery"><RotateCcw size={18} /></button>
                                                            );
                                                        })()}
'@ + "
" + '                                                        '

 =  -replace , 

# Add modal at the end
 = '(\{toast && \([\s\S]*?</Toast>[\s\S]*?\)\})\s*(</div>\s*\);\s*};\s*export default Inventory;)'
 = @'


            {/* Return Battery Modal */}
            {returningBattery && (
                <ReturnBatteryModal
                    battery={returningBattery}
                    user={user}
                    onClose={() => setReturningBattery(null)}
                    onSuccess={(message) => {
                        setToast({ message, type: 'success' });
                        window.location.reload();
                    }}
                />
            )}
        
'@

 =  -replace , 

Set-Content   -Encoding UTF8 -NoNewline
Write-Output "File updated successfully"
