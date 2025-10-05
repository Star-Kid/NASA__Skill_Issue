import asyncio
import bambulabs_api as bl
from aiohttp import ClientSession

ESP1 = '192.168.137.154'
ESP2 = '192.168.137.155'
port1 = 80
port2 = 81

url_data = ""
url_model = ""

printer_ip = '192.168.1.200'
serial = 'AC12309BH109'
access_code = '45235'

# Connect to Bambu Lab printer
printer = bl.Printer(printer_ip, serial, access_code)


async def fetch_stl(session):
    try:
        async with session.post(url_model, timeout=10) as resp:
            if resp.status == 200:
                print("STL model downloaded successfully")
                return await resp.read()
            else:
                print(f"Failed to download STL: HTTP {resp.status}")
                return None
    except Exception as e:
        print("Error fetching STL:", e)
        return None


async def printer_task():
    async with ClientSession() as session:
        while True:
            stl_data = await fetch_stl(session)
            if stl_data:
                try:
                    with open("model.stl", "wb") as f:
                        f.write(stl_data)

                    printer.upload_file("model.stl")
                    printer.start_printing()
                    print(" STL uploaded and print started")

                    # Monitor printer state
                    while True:
                        state = printer.get_state()
                        print(f"Printer status: {state}")
                        if state not in ['Printing', 'Paused']:
                            break
                        await asyncio.sleep(10)
                except Exception as e:
                    print(" Printer error:", e)

            await asyncio.sleep(5)  # wait before next check


async def esp_task():
    async with ClientSession() as session:
        while True:
            try:
                async with session.get(url_data, timeout=10) as resp:
                    if resp.status == 200:
                        data_group = await resp.json()
                        data_bytes = str(data_group[0]).encode()
                        print("ESP data received from server")
                    else:
                        print(f"Bad response from data server: {resp.status}")
                        data_bytes = b"0"
            except Exception as e:
                print("Error fetching ESP data:", e)
                data_bytes = b"0"

            # Send data to each ESP
            for esp_ip, port in [(ESP1, port1), (ESP2, port2)]:
                try:
                    reader, writer = await asyncio.open_connection(esp_ip, port)
                    writer.write(data_bytes)
                    await writer.drain()
                    recv = await reader.read(1024)
                    print(f"Received from {esp_ip}: {recv.decode(errors='ignore')}")
                    writer.close()
                    await writer.wait_closed()
                except Exception as e:
                    print(f"Error connecting to {esp_ip}:{port} — {e}")

            await asyncio.sleep(5)


async def main():
    await asyncio.gather(printer_task(), esp_task())


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProgram stopped by user")
