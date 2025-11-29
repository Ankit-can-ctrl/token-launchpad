import UpdateToken from "../components/UpdateToken";

const ManageToken = ({
  setManageToken,
}: {
  setManageToken: (show: boolean) => void;
}) => {
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
          
          .manage-navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            padding: 16px 24px;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
          }
          
          .back-button {
            pointer-events: auto;
            font-family: 'Caveat', cursive;
            font-size: 1.2rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #fffef9;
            color: #2d2d2d;
            border: 2.5px solid #2d2d2d;
            border-radius: 6px 14px 10px 16px;
            padding: 10px 20px;
            box-shadow: 4px 4px 0 #2d2d2d;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .back-button:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0 #2d2d2d;
          }

          .back-button:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #2d2d2d;
          }
        `}
      </style>

      {/* Navbar with Back Button */}
      <nav className="manage-navbar">
        <button onClick={() => setManageToken(false)} className="back-button">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Launchpad</span>
        </button>
      </nav>

      <UpdateToken />
    </>
  );
};

export default ManageToken;
